async function applyCode(promoCode, utils) {
  const customerId =
    ($('script#__NEXT_DATA__')
      .text()
      .match(/"customerId":"([^"]+)?"/) || [])[1] || '';
  const authToken = (document.cookie.match(/guestUser\.[\w-]+?\.AccessToken=([^&;]+)?/) || [])[1] || '';
  const sourceApp =
    ($('script#__NEXT_DATA__')
      .text()
      .match(/"sourceApp":"([^"]+)?"/) || [])[1] || '';

  try {
    const response = await $.ajax({
      url: `https://prod-beige.api-nm.io/oco-cart-promo/v3/${customerId}/promo-code/${promoCode}?serviceLevel=SL3`,
      type: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
        'content-type': 'application/json; charset=UTF-8',
        sourceApp,
      },
      data: JSON.stringify({}),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoCode, utils) {
  const customerId =
    ($('script#__NEXT_DATA__')
      .text()
      .match(/"customerId":"([^"]+)?"/) || [])[1] || '';
  const authToken = (document.cookie.match(/guestUser\.[\w-]+?\.AccessToken=([^&;]+)?/) || [])[1] || '';
  const sourceApp =
    ($('script#__NEXT_DATA__')
      .text()
      .match(/"sourceApp":"([^"]+)?"/) || [])[1] || '';

  try {
    const response = await $.ajax({
      url: `https://prod-beige.api-nm.io/oco-cart-promo/v3/${customerId}/promo-code/${promoCode}?serviceLevel=SL3`,
      type: 'DELETE',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
        'content-type': 'application/json; charset=UTF-8',
        sourceApp,
      },
      data: JSON.stringify({}),
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
    const priceString = applyCodeResponse?.prices?.orderTotalAmt || originalPrice;
    newPrice = Number(utils.parsePrice(priceString));
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

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(500);
  } else if (!applyCodeResponse?.statusCode === 400) {
    await removeCode(promoCode, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
