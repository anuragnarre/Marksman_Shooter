import urllib.request, json
token = "e20bc22d-8f4a-4410-ad6a-59fc71129965"
url = "https://backboard.railway.app/graphql/v2"
query = """
query {
  projects {
    edges {
      node {
        id
        name
      }
    }
  }
}
"""
req = urllib.request.Request(url, data=json.dumps({"query": query}).encode(), headers={
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(e)
