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




function setup(syscall, state, helpers) {
  return helpers.makeLiveSlots(
    syscall,
    state,
    (E, D) => build(E, D, helpers.log),
    helpers.vatID,
  );
}

const offers = [];

start();
function start() {
  const state = wallet.getPluginState();
  if (state.offers) {
    offers = state.offers;
  }
}

function build() {
  let userFacet;
  let pursesState;
  let inboxState;
  let commandDevice;

  const { publish: pursesPublish, subscribe: purseSubscribe } = pubsub(E);
  const { publish: inboxPublish, subscribe: inboxSubscribe } = pubsub(E);

  async function startup(host, zoe, registrar) {
    const wallet = await makeWallet(
      E,
      log: console.log,
      host,
      zoe,
      registrar,
      pursesPublish,
      inboxPublish,
    );
    userFacet = wallet.userFacet;
  }

  async function getWallet() {
    return harden(userFacet);
  }

  function setCommandDevice(d, _ROLES) {
    commandDevice = d;
  }

  function getCommandHandler() {
    return {
      async processInbound(obj) {
        const { type, data } = obj;
        if (type === 'walletGetPurses') {
          if (pursesState) {
            return {
              type: 'walletUpdatePurses',
              data: pursesState,
            };
          }
          return {};
        }

        if (type === 'walletGetInbox') {
          if (inboxState) {
            return {
              type: 'walletUpdateInbox',
              data: inboxState,
            };
          }
          return {};
        }

        if (type === 'walletAddOffer') {
          const result = userFacet.addOffer(data);
          return {
            type: 'walletOfferAdded',
            data: result,
          };
        }

        if (type === 'walletDeclineOffer') {
          const result = userFacet.declineOffer(data);
          return {
            type: 'walletOfferDeclineed',
            data: result,
          };
        }

        if (type === 'walletAcceptOffer') {
          const result = await userFacet.acceptOffer(data);
          return {
            type: 'walletOfferAccepted',
            data: result,
          };
        }

        return false;
      },
    };
  }

  function setPresences() {
    console.log(`subscribing to walletPurseState`);
    // This provokes an immediate update
    purseSubscribe(
      harden({
        notify(m) {
          pursesState = m;
          if (commandDevice) {
            D(commandDevice).sendBroadcast({
              type: 'walletUpdatePurses',
              data: pursesState,
            });
          }
        },
      }),
    );

    console.log(`subscribing to walletInboxState`);
    // This provokes an immediate update
    inboxSubscribe(
      harden({
        notify(m) {
          inboxState = m;
          if (commandDevice) {
            D(commandDevice).sendBroadcast({
              type: 'walletUpdateInbox',
              data: inboxState,
            });
          }
        },
      }),
    );
  }

  wallet.registerApiRequestHandler({
//    startup,

    getWallet,
    setCommandDevice,
    getCommandHandler,
    setPresences,
    userFacet,
    addOffer: async (offer) => {
      await userFacet.addOffer;
      offers.push(offer);
      await persist();
    },
  })
}

async function persist() {
  wallet.updatePluginState({
    offers,
  })
}


wallet.registerRpcMessageHandler(async (originString, requestObject) => {
  switch (requestObject.method) {
    case 'hello':
      return wallet.send({
        method: 'alert',
        params: [`Hello, ${originString}!`]
      })
    default:
      throw new Error('Method not found.')
  }
})

