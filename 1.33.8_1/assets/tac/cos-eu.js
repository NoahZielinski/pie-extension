async function applyCode(promoCode, utils) {
  const country = (window.location.href.match(/\.com\/([^/]+)?/) || [])[1] || 'en_eur';

  try {
    const response = await $.ajax({
      url: `/${country}/cart/redeemVoucher`,
      type: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json;charset=UTF-8',
      },
      data: JSON.stringify({ voucherCode: promoCode }),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(utils) {
  const country = (window.location.href.match(/\.com\/([^/]+)?/) || [])[1] || 'en_eur';
  try {
    const response = await $.ajax({
      url: `/${country}/cart/releaseVoucher`,
      type: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
      },
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
    const priceString = applyCodeResponse?.orderTotals?.totalPrice;
    newPrice = priceString ? Number(utils.parsePrice(priceString)) : originalPrice;
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
    window.location = window.location.href;
    await utils.wait(500);
  } else {
    await removeCode(utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
