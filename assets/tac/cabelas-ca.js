async function applyCode(promoCode, utils) {
  try {
    const response = await $.ajax({
      url: '/ResponsiveShoppingCart/CheckCouponCode',
      type: 'POST',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      data: {
        discountcouponcode: promoCode,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(utils) {
  try {
    const response = await $.ajax({
      url: '/ResponsiveShoppingCart/Coupons',
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: {
        'removediscountcouponcode ResponsiveShoppingCart': 'Remove Coupon',
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
    const priceString = $(cartResponse).find(cartPriceSelector).text();
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
    window.location = window.location.href;
    await utils.wait(500);
  } else if (finalPrice < originalPrice) {
    await removeCode(utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
