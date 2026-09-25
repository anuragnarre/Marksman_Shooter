import urllib.request, json
req = urllib.request.Request('https://api.render.com/v1/services', headers={'accept': 'application/json', 'authorization': 'Bearer rnd_ITs7cYmDAkfUBtrhjxIzpX1xx1CJ'})
with urllib.request.urlopen(req) as response:
    services = json.loads(response.read())

for s in services:
    srv = s['service']
    print(f"{srv['name']} ({srv['id']})")
    try:
        req_d = urllib.request.Request(f"https://api.render.com/v1/services/{srv['id']}/deploys?limit=1", headers={'accept': 'application/json', 'authorization': 'Bearer rnd_ITs7cYmDAkfUBtrhjxIzpX1xx1CJ'})
        with urllib.request.urlopen(req_d) as r_d:
            deploys = json.loads(r_d.read())
            if deploys:
                d = deploys[0]['deploy']
                print(f"  Latest deploy: {d['status']} (ID: {d['id']})")
    except Exception as e:
        print("  Error fetching deploys:", e)
