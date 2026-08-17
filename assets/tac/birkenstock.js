async function applyOrRemoveCode(promoCode, utils, action) {
  const requestUrl = $('#cart-items-form').attr('action');
  let serializedForm = $('#cart-items-form').serialize();

  if (action === 'remove') {
    serializedForm += '&dwfrm_cart_coupons_i0_deleteCoupon=Remove';
    serializedForm = serializedForm.replace(/(&dwfrm_cart_couponCode=)([\w-]+)?/, '$1');
  } else {
    serializedForm += '&dwfrm_cart_addCoupon=dwfrm_cart_addCoupon';
  }

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: serializedForm,
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const priceString = $(applyCodeResponse).find(cartPriceSelector).text();
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

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else {
    await applyOrRemoveCode(promoCode, utils, 'remove');
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
