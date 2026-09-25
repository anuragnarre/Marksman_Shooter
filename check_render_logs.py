import urllib.request, json, sys

api_key = 'rnd_ITs7cYmDAkfUBtrhjxIzpX1xx1CJ'
headers = {'accept': 'application/json', 'authorization': f'Bearer {api_key}'}

def get_logs(service_id, deploy_id):
    try:
        url = f"https://api.render.com/v1/services/{service_id}/deploys/{deploy_id}"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            
        print(f"\n--- Log snippet for {service_id} (Deploy: {deploy_id}) ---")
        print(f"Status: {data.get('status')}")
        
    except Exception as e:
        print(f"Error fetching logs for {service_id}/{deploy_id}: {e}")

# Marksman web
get_logs('srv-daht5k67bikc73dmcta0', 'dep-dar0id5g1s2s73dovqrg')

# Marksman api
get_logs('srv-daht5t67bikc73dmdsl0', 'dep-dar0id5g1s2s73dovqug')
