import {
  activateWebSocket,
  deactivateWebSocket,
  doFetch,
} from '../utils/fetch-websocket';
import { makeCapTP, E } from '@agoric/captp';
import harden from '@agoric/harden';
import { makeWallet } from '../lib-wallet';
import pubsub from '../pubsub';

const log = console.log

const providerUri = 'ws://localhost:8000/captp/provider';
const walletUri = 'ws://localhost:8000/captp/wallet';

const walletSocket = new WebSocket(walletUri);

const purses = [];
const offers = [];

const { dispatch, getBootstrap } = makeCapTP('myid', myconn.send, myBootstrap);
myconn.onReceive = obj => handler[obj.type](obj);


activateWebSocket({
  onConnect() {
    dispatch(serverConnected());
    walletGetPurses();
    walletGetInbox();
  },
  onDisconnect() {
    /*
    dispatch(serverDisconnected());
    dispatch(deactivateConnection());
    dispatch(updatePurses(null));
    dispatch(updateInbox(null));
    */
  },
  onMessage(message) {
    messageHandler(JSON.parse(message));
  },
});

function messageHandler(message) {
  if (!message) return;
  const { type, data } = message;
  if (type === 'walletUpdatePurses') {
    updatePurses(JSON.parse(data));
  }
  if (type === 'walletUpdateInbox') {
    updateInbox(JSON.parse(data));
  }
}

function updatePurses (_purses) {
  if (!!_purses) {
    purses = _purses
  }

  updateUi();
}

async function updateInbox(_offers) {
  const newOffers = _offers.filter((inbound) => {
    return !offers.includes(inbound)
  })

  for (let offer in newOffers) {
    const message = `Would you like to accept this offer?: ${JSON.stringify(offer)}`
    const approved = await promptUser(message)
    if (approved) {
      doFetch({
          type: 'walletDeclineOffer',
          data: date,
        }); // todo toast
    } else {
      doFetch({
        type: 'walletAcceptOffer',
        data: date,
      }); // todo toast
    }
  }
}

function walletGetPurses() {
  return doFetch({ type: 'walletGetPurses' }).then(messageHandler);
}
function walletGetInbox() {
  return doFetch({ type: 'walletGetInbox' }).then(messageHandler);
}


// Get the remote's bootstrap object and call a remote method.
/**
let wallet
getBootstrap().then((res) => {
  console.log('got res', res)
  wallet = res;


})
.catch((reason) => {
  console.error('Problem getting wallet', reason)
})
**/


wallet.registerApiRequestHandler((origin) => {
  const providerSocket = new WebSocket(providerUri);

  const api = {
    send: async (message) => {
      providerSocket.send(message);
    },
    registerDispatch: async (dispatch) => {
      providerSocket.addEventListener((message) => {
        dispatch(message);
      })
    },
  }

  alert('request from: ' + origin)

  return api
})

function updateUi () {
  asset.balance = String(userBalance)
  let method = created ? 'updateAsset' : 'addAsset'

  for (let purse of purses) {
    const asset = {
      symbol: purse.assayId,
      balance: extent,
      identifier: 'purse' + i,
      decimals: 0,
      customViewUrl: 'http://localhost:3000'
    }

    wallet.send({
      method: 'wallet_manageAssets',
      params: [ method, asset ],
    })
    .catch((reason) => {
      console.error(`problem updating asset`, reason)
    })
  }
}

async function promptUser (message) {
  const response = await wallet.send({ method: 'confirm', params: [message] })
  return response
}

async function persist() {
  wallet.updatePluginState({
    offers,
    purses,
  })
}

