import urllib.request, json
api_key = 'rnd_ITs7cYmDAkfUBtrhjxIzpX1xx1CJ'
headers = {'accept': 'application/json', 'authorization': f'Bearer {api_key}', 'content-type': 'application/json'}

def deploy(service_id):
    url = f"https://api.render.com/v1/services/{service_id}/deploys"
    req = urllib.request.Request(url, data=b'{}', headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as res:
            print(f"Triggered deploy for {service_id}")
    except Exception as e:
        print(f"Failed to trigger {service_id}: {e}")

deploy('srv-daht5k67bikc73dmcta0') # web
deploy('srv-daht5t67bikc73dmdsl0') # api
