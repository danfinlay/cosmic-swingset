import harden from '@agoric/harden';
import { makeHandoffService } from '@agoric/ertp/more/handoff/handoff';
import { makeGallery } from '@agoric/ertp/more/pixels/gallery';

// This vat contains the server-side resources for the demo. To
// enable local testing, it is loaded both into the chain and solo vat machines.

// This vat gets two messages. The first is delivered at startup time, giving
// the vat a chance to create any shared resources which will be used by all
// participants in the demo. It receives a reference to the Mint vat. It does
// not need to return anything.

// The second message is to provision each new participant. It receives the
// user's nickname, and should create a record of demo objects for them to
// use (named the "chainBundle"). The client will fetch this record when it
// starts up, making its properties available to the REPL on the `home`
// object (e.g. `home.gallery`, `home.handoffService`, etc).

function build(E, log) {
  let sharedGalleryUserFacet;
  let sharedHandoffService;
  let sharedDustIssuer;

  let lastPublished;
  const subscribers = [];
  function subscribe(s) {
    subscribers.push(s);
    if (lastPublished !== undefined) {
      E(s).notify(lastPublished);
    }
  }
  function publish(m) {
    lastPublished = m;
    subscribers.forEach(s => {
      E(s).notify(m);
    });
  }

  async function startup(host) {
    // define shared resources

    function stateChangeHandler(newState) {
      publish(newState);
    }

    const canvasSize = 10;
    const gallery = await makeGallery(
      E,
      log,
      host,
      stateChangeHandler,
      canvasSize,
    );
    sharedGalleryUserFacet = gallery.userFacet;
    // TODO: This initial state change may go in the gallery code eventually.
    stateChangeHandler(await E(gallery.readFacet).getState());
    const issuers = await E(gallery.userFacet).getIssuers();
    sharedDustIssuer = issuers.dustIssuer;
    sharedHandoffService = makeHandoffService();
  }

  async function createDemoClientBundle(_nickname) {
    const gallery = sharedGalleryUserFacet;
    const handoffService = sharedHandoffService;
    const purse = await sharedDustIssuer.makeEmptyPurse();
    const canvasStatePublisher = harden({ subscribe });
    const chainBundle = {
      gallery,
      handoffService,
      purse,
      canvasStatePublisher,
    };
    return harden(chainBundle);
  }

  return harden({ startup, createDemoClientBundle });
}

export default function setup(syscall, state, helpers) {
  return helpers.makeLiveSlots(
    syscall,
    state,
    E => build(E, helpers.log),
    helpers.vatID,
  );
}
