async function applyCodeCart(promoCode, utils, baseUrl) {
  const applyCodeUrl = `${baseUrl}/checkout/cart/couponPost/`;

  try {
    const response = await $.ajax({
      url: applyCodeUrl,
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: {
        remove: 0,
        coupon_code: promoCode,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePriceCart(cartPriceSelector, originalPrice, utils) {
  const PRICE_REGEX = /"grand_total":"?(.*?)"?,/;
  let newPrice;
  let priceScript;

  try {
    const priceResponse = await $.ajax({
      url: window.location.href,
      type: 'GET',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      },
    });
    const priceHtml = priceResponse.responseText;
    priceScript = $(priceHtml).find('script:contains("window.checkoutConfig")').text();

    // for some reason the jquery find method doesn't work to find this script element on all sites even when the element exists
    // hockeymonkey.com was the one I ran across where find() returns nothing but filter() does find the element
    if (!priceScript) {
      priceScript = $(priceHtml).filter('script:contains("window.checkoutConfig")').text();
    }

    const priceMatch = priceScript.match(PRICE_REGEX);
    const rawPrice = (priceMatch && priceMatch[1]) || originalPrice;
    newPrice = parseFloat(rawPrice).toFixed(2);
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function applyCodeCheckout(promoCode, utils, baseUrl, quoteId, storeCode) {
  const applyCodeUrl = `${baseUrl}/rest/${storeCode}/V1/guest-carts/${quoteId}/coupons/${promoCode}`;

  try {
    const response = await $.ajax({
      url: applyCodeUrl,
      type: 'PUT',
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePriceCheckout(cartPriceSelector, originalPrice, utils, baseUrl, quoteId, storeCode) {
  const getPriceUrl = `${baseUrl}/rest/${storeCode}/V1/guest-carts/${quoteId}/payment-information`;
  let newPrice;

  try {
    const priceResponse = await $.ajax({
      url: getPriceUrl,
      type: 'GET',
    });
    newPrice = priceResponse.responseJSON.totals.base_grand_total;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(`$${newPrice}`);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  const BASE_URL_REGEX = /((?:https|http)?:\/\/?(?:[^@\n]+@)?(?:www\.)?(?:[^:/\n?]+)).*/;
  const CART_URL_REGEX = /\/checkout\/cart/;

  // get base URL for constructing coupon application URLs
  const baseUrl = (window.location.href.match(BASE_URL_REGEX) || [])[1];

  // cart is BASE_URL/checkout/cart
  // checkout is BASE_URL/checkout
  const couponLocation = window.location.href.match(CART_URL_REGEX) ? 'cart' : 'checkout';

  const quoteId = ($('script:contains(window.checkoutConfig)')
    .text()
    .match(/"(?:quoteId|entity_id)":"(.*?)"/) || [])[1];
  const storeCode = ($('script:contains(window.checkoutConfig)')
    .text()
    .match(/"storeCode":"(.*?)"/) || [])[1];

  let finalPrice = currentPrice;

  if (couponLocation === 'cart') {
    await applyCodeCart(promoCode, utils, baseUrl);
    finalPrice = await updatePriceCart(cartPriceSelector, originalPrice, utils);
  } else {
    await applyCodeCheckout(promoCode, utils, baseUrl, quoteId, storeCode);
    finalPrice = await updatePriceCheckout(cartPriceSelector, originalPrice, utils, baseUrl, quoteId, storeCode);
  }

  if (isApplyBest === true) {
    window.location.reload();
    await utils.wait(200);
  }
  return Number(utils.parsePrice(finalPrice));
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
