#!/usr/bin/env python
import os
import json
import cgi
import sys
import redis
from os import walk
from time import mktime,struct_time
from datetime import datetime
from os.path import join
from flask import Flask, jsonify
from flask.ext.cors import CORS
from werkzeug.routing import BaseConverter
from git import *
from pprint import pprint


Blob.full_path = None

thingroot = os.path.dirname(os.path.realpath(__file__))
git = os.environ.get("GIT_PYTHON_GIT_EXECUTABLE", 'git')
root = os.environ.get("REPO_ROOT", os.path.realpath(os.path.join(thingroot, '../', 'repos')))
redis_conn = redis.Redis()
app = Flask(__name__)

cors = CORS(app, resources={r"/*": {"origins": "*"}})
class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]
app.url_map.converters['regex'] = RegexConverter


def struct_time_to_iso(obj):
    dt = datetime.fromtimestamp(mktime(obj))
    return dt.isoformat()


def git_serializer(obj):
    if isinstance(obj, set):
        return list(obj)
    elif isinstance(obj, Commit):
        commit = {
            'author': {
                'email': obj.author.email,
                'name': obj.author.name
            },
            'message': obj.message,
            'summary': obj.summary,
            'authored_date': struct_time_to_iso(obj.authored_date),
            'committed_date': struct_time_to_iso(obj.committed_date),
            'stats': obj.stats.total,
            'id': {
                'full': obj.id,
                'abbrev': obj.id_abbrev
            },
            'items': []
        }

        # Commit tree items
        for item in obj.tree.items():
            name, blob = item
            c = obj.tree.repo.commits(path=name, max_count=1)
            size = None
            mime_type = None
            path = blob.basename

            if isinstance(blob, Blob):
                size = blob.size
                mime_type = blob.mime_type
                ttype = "blob"
            else:
                ttype = "tree"
                path = blob.name
            commit['items'].append({
                'path': path,
                'type': ttype,
                'name': name,
                'size': size,
                'mime_type': mime_type,
                'message': c[0].message
            })
        return commit
    elif isinstance(obj, Blob):
        c = obj.repo.commits(path=obj.full_path, max_count=1)
        return {
            'type': 'blob',
            'path': obj.full_path,
            'basename': obj.basename,
            'name': obj.name,
            'size': obj.size,
            'mime_type': obj.mime_type,
            'authored_date': struct_time_to_iso(c[0].authored_date),
            'committed_date': struct_time_to_iso(c[0].committed_date),
            'message': c[0].message,
        }
    elif isinstance(obj, Tree):
        return {
            'type': 'tree',
            'path': obj.full_path,
            'name': obj.name
        }
    else:
        print("Unknown type {0}".format(type(obj)))
    raise TypeError



def walk_tree(path_arr, tree, data, basepath):
    for current in path_arr:
        node = tree[current]
        if len(path_arr) <= 1:
            for name, blob in node.items():
                blob.full_path = "{0}/{1}".format(basepath, blob.name)
                data.append(blob)
        elif isinstance(node, Tree):
            path_arr.pop(0)
            data = walk_tree(path_arr, node, data, basepath)
    return data


def get_blob_by_path(path_arr, tree, basepath):
    for current in path_arr:
        node = tree[current]
        if len(path_arr) <= 1:
            node.full_path = "{0}".format(basepath)
            return node
        elif isinstance(node, Tree):
            path_arr.pop(0)
            return get_blob_by_path(path_arr, node, basepath)


@app.route('/repos/<permalink>/tree/<branch>/<regex(".*"):basepath>', methods=['GET', 'OPTIONS'])
def tree(permalink, branch, basepath):

    redis_key = "{0}:{1}:{2}".format(permalink, branch, basepath)
    is_cached = redis_conn.get(redis_key)
    if is_cached:
        return is_cached

    response = {
        "status": "success",
        "data": [],
    }

    repo = Repo(join(root, permalink))
    basepath = basepath.strip("/")
    path_arr = basepath.split("/")
    data = []
    response['data'] = walk_tree(path_arr, repo.tree(), data, basepath)

    retval = json.dumps(response, default=git_serializer)
    redis_conn.set(redis_key, retval)
    return retval


@app.route('/repos/<permalink>/blob/<branch>/<regex(".*"):path>', methods=['GET', 'OPTIONS'])
def blob(permalink, branch, path):
    
    redis_key = "{0}:{1}:{2}".format(permalink, branch, path)
    is_cached = redis_conn.get(redis_key)
    if is_cached:
        return is_cached

    response = {
        "status": "success",
    }

    repo = Repo(join(root, permalink))
    basepath = path.strip("/")
    path_arr = basepath.split("/")
    blob = get_blob_by_path(path_arr, repo.tree(), basepath)
    
    size = blob.size
    mime_type = blob.mime_type
    c = repo.commits(path=blob.full_path, max_count=1)
    response["data"] = {
        'data': blob.data,
        'path': blob.full_path,
        'size': size,
        'mime_type': mime_type,
        'message': c[0].message
    }

    retval = json.dumps(response, default=git_serializer)
    redis_conn.set(redis_key, retval)
    return retval

@app.route('/repos/<permalink>', methods=['GET', 'OPTIONS'])
def repo(permalink):

    is_cached = redis_conn.get(permalink)

    if is_cached:
        return is_cached

    data = {
        'heads': []
    }

    repo = Repo(join(root, permalink))
    heads = repo.heads  # Head listing

    for head in heads:
        data['heads'].append(head.name)


    data['log'] = repo.log()
    most_recent = repo.log()[0]
    data['meta'] = {
        'commit_count': repo.commit_count(),
        'branches': len(repo.branches),
        'description': repo.description,
        'latest_commit': most_recent
    }


    response = {
        'status': "success",
        'data': data
    }
    
    retval = json.dumps(response, default=git_serializer)
    redis_conn.set(permalink, retval)


    return retval

@app.route('/repos/', methods=['GET', 'OPTIONS'])
def repos():
    f = []
    for (dirpath, dirnames, filenames) in walk(root):
        for x in dirnames:
            f.append({
                "name": x,
                "permalink": x,
            })
        break

    response = {
        'status': "success",
        'data': f
    }
    return json.dumps(response)

if __name__ == '__main__':
    app.run(debug=True)