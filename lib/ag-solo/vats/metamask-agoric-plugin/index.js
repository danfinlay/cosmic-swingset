const {
  activateWebSocket,
  deactivateWebSocket,
  doFetch,
  websocket,
} = require('./fetch-websocket');
// const { makeCapTP, E } = require('@agoric/captp')
// const providerUri = 'ws://localhost:8000/captp/provider';

let purses = [];
let offers = [];

const walletListeners = [];
const WALLET_DOMAIN = 'localhost'

/**
const { dispatch, getBootstrap } = makeCapTP('myid', myconn.send, myBootstrap);
myconn.onReceive = obj => handler[obj.type](obj);
**/

console.log('activating web socket')

activateWebSocket({
  onConnect() {
    console.log('on connect!')
    walletGetPurses();
    walletGetInbox();
  },
  onDisconnect() {
    /*
    deactivateConnection()
    dispatch(serverDisconnected());
    dispatch(updatePurses(null));
    dispatch(updateInbox(null));
    */
  },
  onMessage: messageHandler,
});

function messageHandler(message) {
  console.log('message handler received', message)
  if (!message) return;
  const { type, data } = message;
  if (type === 'walletUpdatePurses') {
    updatePurses(JSON.parse(data));
  }
  if (type === 'walletUpdateInbox') {
    updateInbox(JSON.parse(data));
  }

  if (!message.type) {
    return
  }
  console.log(`Informing ${walletListeners.length} listeners`, message)
  for (let listener of walletListeners) {
    listener(message)
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
      walletAcceptOffer()
    } else {
      walletDeclineOffer()
    }
  }
}

function walletAcceptOffer (date) {
  doFetch({
    type: 'walletDeclineOffer',
    data: date,
  }); // todo toast
}

function walletDeclineOffer (date) {
  doFetch({
    type: 'walletAcceptOffer',
    data: date,
  }); // todo toast
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

const permittedMethods = ['walletGetPurses', 'walletAddOffer']
wallet.registerApiRequestHandler((origin) => {

  const api = {
    send: async (message) => {
      if (origin === WALLET_DOMAIN || permittedMethods.includes(message.type)) {
        websocket.send(message);
      }
    },
    registerDispatch: async (dispatch) => {
      console.log('plugin registering an event listener')
      if (!websocket) throw new Error('There is no websocket connection to blockchain.')
      websocket.addEventListener((message) => {
        dispatch(message);
      })
   },
    onMessage: (listener) => {
      console.log('a listener has requested on message')
      walletListeners.push(listener);
      walletGetInbox()
      walletGetPurses()
    }
  }

  console.log('requesting domain is ', origin)
  if (origin === WALLET_DOMAIN) {
    api.walletAcceptOffer = walletAcceptOffer
    api.walletDeclineOffer = walletDeclineOffer
  }

  return api
})

let created = false
function updateUi () {
  let method = created ? 'updateAsset' : 'addAsset'
  console.log('updating asset!', purses)

  for (let purse of purses) {
    const asset = {
      symbol: purse.assayId,
      balance: purse.extent,
      identifier: 'purse' + purse.assayId,
      decimals: 0,
      customViewUrl: 'http://localhost:3000'
    }

    console.log('sending asset', asset)
    wallet.send({
      method: 'wallet_manageAssets',
      params: [ method, asset ],
    })
    .catch((reason) => {
      console.error(`problem updating asset`, reason)
    })
  }
  created = true
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

