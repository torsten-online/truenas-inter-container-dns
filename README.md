# TruenNAS Scale Fangtooth 25.04

This workaround works also for TrueNAS Scale Fangtooth - if you dont want expose e.g. your postgres DB externally, you should enable inter-container communication with this workaround.

After this Container is running, it will add the internal network and DNS Settings. Please restart your internal container also after this Service is running.

Your Containers will be reachable over inter-container network, e.g. over Hostname ix-postgres-postgres-1

If you want get your container DNS Names and networks, please simply run this command:

````bash
docker ps --format "table {{.Names}}\t{{.ID}}\t{{.Networks}}"
````
*Important: Please note: Dont configure manually over console any docker setting, this is not recommended*

# Dragonify

This is a small utility for TrueNAS SCALE 24.10 (Electric Eel) which configures the Docker networking for TrueNAS-managed apps to allow them to communicate with each other, as was in 24.04 (Dragonfish). It will also add a DNS alias in the format `{service}.ix-{app-name}.svc.cluster.local` for each service to ensure backward-compatibility with the old Kubernetes-based apps system.

It's a stop-gap until inter-app networking is [properly implemented in Fangtooth](https://forums.truenas.com/t/inter-app-communication-in-24-10-electric-eel/22054).

> [!WARNING]  
> Dragonify introduces functionality that is unsupported by iXsystems. If you are having problems with your TrueNAS installation or its apps, please try stopping Dragonify and restarting all apps to see if the problem persists.

## Installation

1. Go to "Apps" in the TrueNAS SCALE web UI.
2. Click "Discover Apps".
3. Click **⋮** in the top-right corner, then "Install via YAML".
4. Set the name to `dragonify`, and paste the following YAML into the text box.

```yaml
services:
  dragonify:
    image: ghcr.io/tjhorner/dragonify:main
    restart: always
    environment:
      LOG_LEVEL: info # change to debug for more verbose logging
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

Once started, all of your apps will now be connected on the same Docker network with DNS aliases for each service.

## Technical Details

To facilitate inter-app communication, Dragonify creates a new Docker bridge network called `apps-internal`. It connects all existing TrueNAS-managed containers to the network, then starts listening for new containers to be started. When a new container is started, Dragonify will automatically connect it to the `apps-internal` network.

It is essentially running this command automatically for you (using postgres as an example):

```sh
docker network connect apps-internal --alias postgres.ix-postgres.svc.cluster.local ix-postgres-postgres-1
```

## License

MIT
