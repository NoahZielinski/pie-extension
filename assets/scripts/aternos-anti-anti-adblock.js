// Aternos anti-anti-adblock content script. Runs at document_start in the MAIN world.
// Gated behind the `aternos-anti-anti-adblock` feature flag — flip the flag off to
// disable without an extension release if Aternos changes behavior in a way that
// breaks this.
(() => {
  function safe(name, fn) {
    try {
      fn();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.debug('[pie-aternos] patch failed:', name, e && e.message);
    }
  }

  // Bail if another extension already touched Proxy so we don't clobber.
  const proxyIsNative = Function.prototype.toString.call(Proxy).indexOf('[native code]') !== -1;
  if (!proxyIsNative) {
    return;
  }

  // Patch Proxy: when the detection code constructs a Proxy over an empty object
  // (its typical fingerprinting/trap pattern), force every getter to return a
  // truthy function so feature-detection probes pass. We narrow on
  // `!('get' in handler)` — i.e. only handlers that don't already define their
  // own `get` trap — to avoid corrupting reactive-library proxies (Vue, MobX,
  // Solid, Valtio, Immer, etc.) which always supply a `get` trap.
  //
  // NOTE on `Proxy.revocable` (greptile feedback): we deliberately do NOT
  // expose `Proxy.revocable` on the wrapper. Empirically, ANY form of
  // forwarding (raw assignment, wrapping, with or without applying our handler
  // patch) breaks Aternos and brings the anti-adblock screen back. Aternos
  // appears to fingerprint either the existence/identity of `Proxy.revocable`
  // or detect when it's called with `this !== nativeProxy`. Leaving it
  // undefined matches ascended1013's field-tested userscript, which doesn't
  // forward it either. Trade-off: legitimate `Proxy.revocable(...)` callers on
  // aternos.org would crash — but in practice no Aternos page code seems to
  // call it (or it tolerates the throw), since the bare-proxy-patch version
  // works fine.
  safe('patch-proxy', () => {
    const OrigProxy = Proxy;
    // eslint-disable-next-line no-global-assign
    Proxy = function (target, handler) {
      try {
        if (JSON.stringify(target) === '{}' && !('get' in handler)) {
          handler.get = () => () => true;
        }
      } catch (e) {
        // target may be non-serializable; leave handler alone
      }
      return new OrigProxy(target, handler);
    };
  });

  // Belt-and-suspenders: re-enable the start button if the obfuscated script's
  // own re-enable logic didn't run for any reason. Polls for ~10s after page
  // ready, then stops to avoid being a permanent forced-true.
  safe('reenable-start', () => {
    const start = () => {
      let ticks = 0;
      const iv = setInterval(() => {
        ticks += 1;
        const el = document.getElementById('start');
        if (el && el._ready !== true) {
          el._ready = true;
        }
        if (ticks > 100) clearInterval(iv); // 100 * 100ms = 10s
      }, 100);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  });
})();
