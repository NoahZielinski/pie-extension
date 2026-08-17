const xsrfToken = (document.cookie.match(/XSRF-TOKEN=(.*?);/) || [])[1];
const csrfToken = (document.cookie.match(/SF-CSRF-TOKEN=(.*?);/) || [])[1];
let tacRunState;

async function applyCodeCart(promoCode, utils, baseUrl) {
  try {
    const response = await $.ajax({
      url: `${baseUrl}/remote/v1/apply-code`,
      type: 'POST',
      headers: {
        'X-Sf-Csrf-Token': csrfToken,
        'X-Xsrf-Token': xsrfToken,
      },
      data: {
        code: promoCode,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCodeCart(removeCodeLink, utils) {
  try {
    const response = await $.ajax({
      url: removeCodeLink,
      type: 'GET',
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
    return null;
  }
}

async function getSessionId(utils, baseUrl) {
  const sessionIdUrl = `${baseUrl}/api/storefront/carts`;
  let sessionId = tacRunState?.tacMemory?.sessionId;

  try {
    const response = await $.ajax({
      url: sessionIdUrl,
      type: 'GET',
      headers: {
        'X-Sf-Csrf-Token': csrfToken,
        'X-Xsrf-Token': xsrfToken,
      },
    });

    sessionId = response[0].id;
    tacRunState.tacMemory = { sessionId };
    return sessionId;
  } catch (error) {
    utils.logger.debug(`Session ID fetching error: ${error}`);
    return sessionId;
  }
}

async function applyOrRemoveCodeCheckout(promoCode, utils, baseUrl, action) {
  const sessionId = await getSessionId(utils, baseUrl);
  const couponUrlPart = action === 'apply' ? '' : `/${promoCode}`;
  const requestMethod = action === 'apply' ? 'POST' : 'DELETE';
  const requestUrl = `${baseUrl}/api/storefront/checkouts/${sessionId}/coupons${couponUrlPart}?include=
    cart.lineItems.physicalItems.options,
    cart.lineItems.digitalItems.options,
    customer,
    customer.customerGroup,
    payments,
    promotions.banners,
    consignments.availableShippingOptions`.replace(/\s/g, '');

  try {
    const response = await $.ajax({
      url: requestUrl,
      method: requestMethod,
      headers: {
        accept: 'application/vnd.bc.v1+json',
        'content-type': 'application/json',
        'X-Sf-Csrf-Token': csrfToken,
        'X-Xsrf-Token': xsrfToken,
      },
      data: JSON.stringify({
        couponCode: promoCode,
      }),
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon: ${error}`);
    return null;
  }
}

async function updatePriceCart(cartPriceSelector, originalPrice, utils) {
  let removeCodeLink = '';
  let newPrice;

  const priceResponse = $.ajax({
    url: window.location.href,
    type: 'GET',
  });

  await priceResponse
    .done(() => {
      utils.logger.debug('Finished fetching price info');
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      utils.logger.debug(`Price fetching error: ${errorThrown}`);
    });

  try {
    newPrice = $(priceResponse.responseText).find(cartPriceSelector).text();
    removeCodeLink = $(priceResponse.responseText).find('a[href*="action=removecoupon"]').attr('href');
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(`${newPrice}`);
  }
  return { newPrice, removeCodeLink };
}

async function updatePriceCheckout(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.grandTotal;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(`$${newPrice}`);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice }) {
  const BASE_URL_REGEX = /((?:https|http)?:\/\/?(?:[^@\n]+@)?(?:www\.)?(?:[^:/\n?]+)).*/;
  const CART_URL_REGEX = /\/cart\.php/;

  // get base URL for constructing coupon application URLs
  const baseUrl = (window.location.href.match(BASE_URL_REGEX) || [])[1];

  // cart is BASE_URL/cart.php
  // checkout is BASE_URL/checkout
  const couponLocation = window.location.href.match(CART_URL_REGEX) ? 'cart' : 'checkout';

  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  tacRunState = runState;

  if (couponLocation === 'cart') {
    await applyCodeCart(promoCode, utils, baseUrl);
    const { newPrice, removeCodeLink } = await updatePriceCart(cartPriceSelector, originalPrice, utils);
    finalPrice = newPrice;
    if (removeCodeLink) {
      await removeCodeCart(removeCodeLink, utils);
    }
  } else {
    const applyCodeResponse = await applyOrRemoveCodeCheckout(promoCode, utils, baseUrl, 'apply');
    finalPrice = await updatePriceCheckout(applyCodeResponse, cartPriceSelector, originalPrice, utils);
    await applyOrRemoveCodeCheckout(promoCode, utils, baseUrl, 'remove');
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
