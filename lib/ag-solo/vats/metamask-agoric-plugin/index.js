const soloUri = 'ws://localhost:8000';
import { makeCapTP, E } from '@agoric/captp';




import harden from '@agoric/harden';
import { makeWallet } from '../lib-wallet';
import pubsub from '../pubsub';
const log = console.log



const { dispatch, getBootstrap } = makeCapTP('myid', myconn.send, myBootstrap);
myconn.onReceive = obj => handler[obj.type](obj);

// Get the remote's bootstrap object and call a remote method.
E(getBootstrap()).method(args).then(res => console.log('got res', res));


wallet.registerApiRequestHandler({
  send: async (message) => {

    if (isUserPromptable(message)) {
      // prompt the user before doing it
    }

  },
  registerHandler: async (handler) => {

  },
})

async function persist() {
  wallet.updatePluginState({
    offers,
  })
}

