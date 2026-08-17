let tacRunState;

async function constructCart() {
  const productElements = $('.sp-checkout__product div.js-tracked-product-full-view');
  const cartProducts = tacRunState?.tacMemory?.cartProducts || [];

  if (!cartProducts.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const productElement of productElements) {
      const partNumber = $(productElement).attr('data-id');

      const onetimeAttr = $(productElement).attr('data-autoship-applied');
      const onetime = onetimeAttr === '0' ? 'false' : 'true';

      const itemIdEl = $(productElement).find('input.kib-form-radio__control:first');
      const itemId = itemIdEl.attr('name');

      cartProducts.push({
        partNumber,
        onetime,
        itemId,
      });
    }

    tacRunState.tacMemory = { cartProducts };
  }

  return cartProducts;
}

async function applyCode(promoCode, utils) {
  const token = (document.cookie.match(/dtPC=([^&;]+)?/) || [])[1];
  const cartProducts = await constructCart();
  const containsSubscription = cartProducts.some((product) => product.onetime === 'false');

  try {
    const response = await $.ajax({
      url: '/proxy/api/checkout/promotion',
      type: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Dtpc': token,
      },
      data: JSON.stringify({
        code: promoCode,
        itemLevelSelections: cartProducts,
        paymentMethodType: {},
        subscription: containsSubscription,
      }),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoCode, utils) {
  const token = (document.cookie.match(/dtPC=([^&;]+)?/) || [])[1];
  const cartProducts = await constructCart();
  const containsSubscription = cartProducts.some((product) => product.onetime === 'false');

  try {
    const response = await $.ajax({
      url: '/proxy/api/checkout/delete-promotion',
      type: 'PUT',
      headers: {
        'content-type': 'application/json',
        'X-Dtpc': token,
      },
      data: JSON.stringify({
        code: promoCode,
        itemLevelSelections: cartProducts,
        subscription: containsSubscription,
      }),
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.total || originalPrice;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  tacRunState = runState;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else if (applyCodeResponse && !applyCodeResponse.errorCode) {
    await removeCode(promoCode, utils);
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    runState: tacRunState,
  };
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
