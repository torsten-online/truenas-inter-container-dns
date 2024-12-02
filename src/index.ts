import Docker from "dockerode"
import { getEventStream } from "./docker-events"

const NETWORK_NAME = "apps-internal"

async function setUpNetwork(docker: Docker) {
  console.log(`Setting up network ${NETWORK_NAME}`)

  const existingNetworks = await docker.listNetworks({filters: {name: [NETWORK_NAME]}})
  if (existingNetworks.length === 1) {
    console.log("Network already exists")
    return
  }

  await docker.createNetwork({
    Name: NETWORK_NAME,
    Driver: "bridge",
    Internal: true,
  })

  console.log("Network created")
}

function getDnsName(container: Docker.ContainerInfo) {
  const service = container.Labels["com.docker.compose.service"]
  const project = container.Labels["com.docker.compose.project"]
  return `${service}.${project}.svc.cluster.local`
}

async function connectContainerToAppsNetwork(docker: Docker, container: Docker.ContainerInfo) {
  const network = docker.getNetwork(NETWORK_NAME)
  const dnsName = getDnsName(container)

  console.log(`Connecting container ${container.Id} to network as ${dnsName}`)

  await network.connect({
    Container: container.Id,
    EndpointConfig: {
      Aliases: [ dnsName ]
    }
  })

  console.log("Container connected to network")
}

function isContainerInNetwork(container: Docker.ContainerInfo) {
  return container.NetworkSettings.Networks[NETWORK_NAME] !== undefined
}

function isIxProjectName(name: string) {
  return name.startsWith("ix-")
}

function isIxAppContainer(container: Docker.ContainerInfo) {
  return isIxProjectName(container.Labels["com.docker.compose.project"])
}

async function connectAllContainersToAppsNetwork(docker: Docker) {
  console.log("Connecting existing app containers to network")

  const containers = await docker.listContainers({
    limit: -1,
    filters: {
      label: [ "com.docker.compose.project" ]
    }
  })

  const appContainers = containers.filter(isIxAppContainer)
  for (const container of appContainers) {
    if (isContainerInNetwork(container)) {
      continue
    }

    await connectContainerToAppsNetwork(docker, container)
  }

  console.log("All existing app containers connected to network")
}

async function connectNewContainerToAppsNetwork(docker: Docker, containerId: string) {
  const [ container ] = await docker.listContainers({
    filters: {
      id: [ containerId ]
    }
  })

  if (!container) {
    console.warn(`Container ${containerId} not found`)
    return
  }

  if (isContainerInNetwork(container)) {
    return
  }

  console.log(`New container started: ${container.Id}`)
  await connectContainerToAppsNetwork(docker, container)
}

async function main() {
  const docker = new Docker()

  await setUpNetwork(docker)
  await connectAllContainersToAppsNetwork(docker)

  const events = getEventStream(docker)
  events.on("container.start", (event) => {
    const containerAttributes = event.Actor.Attributes
    if (!isIxProjectName(containerAttributes["com.docker.compose.project"])) {
      return
    }

    connectNewContainerToAppsNetwork(docker, event.Actor["ID"])
  })
}

main()
