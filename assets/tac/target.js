async function applyCode(promoCode, utils) {
  const token =
    ($('script')
      .text()
      .match(/"defaultServicesApiKey.?":.?"([^\\"]+)?/) || [])[1] || '';

  try {
    const response = await $.ajax({
      url: `https://carts.target.com/web_checkouts/v1/cart_promotion_codes?cart_type=REGULAR&key=${token}`,
      type: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      xhrFields: {
        // To allow cross domain cookies
        withCredentials: true,
      },
      data: JSON.stringify({
        cart_type: 'REGULAR',
        promotion_code: promoCode,
        promotion_type: 'CODE',
      }),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function getCart(utils) {
  const token =
    ($('script')
      .text()
      .match(/"defaultServicesApiKey.?":.?"([^\\"]+)?/) || [])[1] || '';

  try {
    const response = await $.ajax({
      url: `https://carts.target.com/web_checkouts/v1/cart_views?cart_type=REGULAR&key=${token}&client_feature=cart`,
      type: 'GET',
      headers: {
        accept: 'application/json',
      },
      xhrFields: {
        // To allow cross domain cookies
        withCredentials: true,
      },
    });

    utils.logger.debug('Finishing fetching cart');
    return response;
  } catch (error) {
    utils.logger.debug(`Error fetching cart: ${error}`);
    return null;
  }
}

function updatePrice(cartResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const priceString = cartResponse?.summary?.grand_total || originalPrice;
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

  await applyCode(promoCode, utils);
  const cartResponse = await getCart(utils);
  finalPrice = updatePrice(cartResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(500);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
