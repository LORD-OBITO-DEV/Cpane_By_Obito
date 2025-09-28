import axios from 'axios';
import config from './config.js';

export async function createPteroUser(username, password, email){
  const res = await axios.post(`${config.PTERO_URL}/api/application/users`, {
    username, email, first_name: username, last_name: "Client", password
  }, {
    headers: { "Authorization": `Bearer ${config.PTERO_API_KEY}`, "Content-Type": "application/json", "Accept": "application/json" }
  });
  return res.data.attributes.id;
}

export async function createPteroServer(userId, panelName){
  const res = await axios.post(`${config.PTERO_URL}/api/application/servers`, {
    name: panelName, user: userId, nest: config.NEST_ID, egg: config.EGG_ID,
    docker_image: "ghcr.io/pterodactyl/yolks:nodejs:16",
    startup: "node index.js",
    limits: { memory: config.PANEL_DEFAULT_RAM, cpu: config.PANEL_DEFAULT_CPU, disk: config.PANEL_DEFAULT_DISK, swap: 0 },
    environment: { SERVER_JARFILE: "server.js" },
    allocation: { default: 1 }
  }, { headers: { "Authorization": `Bearer ${config.PTERO_API_KEY}`, "Content-Type": "application/json", "Accept": "application/json" }});
  return res.data.attributes.id;
}