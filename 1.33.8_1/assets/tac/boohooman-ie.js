async function applyCode(promoCode, utils) {
  const requestUrl =
    ($('script')
      .text()
      .match(/"addCoupon":"([^\\"]+)?"/) || [])[1] || 'https://www.boohooman.com/on/demandware.store/Sites-boohooman-EU-Site/en_IE/Cart-AddCouponJson';
  const dtpc = (document.cookie.match(/dtPC=([^;]+)?/) || [])[1] || '';

  try {
    const response = await $.ajax({
      url: `${requestUrl}?couponCode=${promoCode}&format=ajax`,
      type: 'POST',
      headers: {
        'X-Dtpc': dtpc,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoCode, utils) {
  const requestUrl =
    ($('script')
      .text()
      .match(/"removeCoupon":"([^\\"]+)?"/) || [])[1] || 'https://www.boohooman.com/on/demandware.store/Sites-boohooman-EU-Site/en_IE/COBilling-RemoveCoupon';
  const dtpc = (document.cookie.match(/dtPC=([^;]+)?/) || [])[1] || '';

  try {
    const response = await $.ajax({
      url: `${requestUrl}?couponID=${promoCode}`,
      type: 'GET',
      headers: {
        'X-Dtpc': dtpc,
      },
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
    return null;
  }
}

async function getCart(utils) {
  try {
    const response = await $.ajax({
      url: window.location.href,
      type: 'GET',
    });

    utils.logger.debug('Finished fetching cart');
    return response;
  } catch (error) {
    utils.logger.debug(`Error fetching cart: ${error}`);
    return null;
  }
}

function updatePrice(cartResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = $(cartResponse).find(cartPriceSelector).text() || originalPrice;
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

  await applyCode(promoCode, utils);
  const cartResponse = await getCart(utils);
  finalPrice = updatePrice(cartResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else {
    await removeCode(promoCode, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
