async function applyCodeCart(promoCode, utils) {
  const csrfToken = $('.promo-code-form input[name*=csrf_token]').val();

  try {
    const response = await $.ajax({
      url: 'https://www.catherines.com/on/demandware.store/Sites-oss-Site/default/Cart_SFRA-ApplyCoupon',
      method: 'GET',
      data: {
        couponCode: promoCode,
        csrf_token: csrfToken,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCodeCart(promoCode, applyCodeResponse, utils) {
  try {
    const couponId = applyCodeResponse.totals.discounts[0].UUID;
    await $.ajax({
      url: 'https://www.catherines.com/on/demandware.store/Sites-oss-Site/default/Cart_SFRA-RemoveCouponLineItem',
      method: 'GET',
      data: {
        code: promoCode,
        uuid: couponId,
        type: 'coupon',
      },
    });
    utils.logger.debug('Finishing removing coupon');
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
  }
}

async function removeCodeCheckout(promoCode, applyCodeResponse, utils) {
  try {
    const couponId = applyCodeResponse.couponsandrewards.discounts[0].UUID;
    await $.ajax({
      url: 'https://www.catherines.com/on/demandware.store/Sites-oss-Site/default/Cart_SFRA-CheckoutRemoveCoupon',
      method: 'GET',
      data: {
        code: promoCode,
        uuid: couponId,
        type: 'coupon',
      },
    });
    utils.logger.debug('Finishing removing coupon');
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
  }
}

async function applyCodeCheckout(promoCode, utils) {
  const stepNumber = $('#couponCheckoutStep').val() || '0';
  try {
    const response = await $.ajax({
      url: 'https://www.catherines.com/on/demandware.store/Sites-oss-Site/default/Cart_SFRA-CheckoutApplyCoupon',
      method: 'GET',
      data: {
        couponCode: promoCode,
        couponCheckoutStep: stepNumber,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePriceCart(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    if (applyCodeResponse.cartTotal) {
      newPrice = applyCodeResponse.cartTotal;
    } else {
      newPrice = originalPrice;
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }
  // If the current price is less than the final price, update the final price and the price on the page
  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function updatePriceCheckout(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    if (applyCodeResponse.couponsandrewards.couponsHtml) {
      const tempDom = $('<div></div>').append($.parseHTML(applyCodeResponse.couponsandrewards.couponsHtml));
      newPrice = $(tempDom).find(cartPriceSelector).val();
    } else {
      newPrice = originalPrice;
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }
  // If the current price is less than the final price, update the final price and the price on the page
  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const isCheckout = window.location.href.includes('/checkout');
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  if (isCheckout) {
    const applyCodeResponse = await applyCodeCheckout(promoCode, utils);
    finalPrice = await updatePriceCheckout(applyCodeResponse, cartPriceSelector, originalPrice, utils);

    if (isApplyBest === true) {
      window.location = window.location.href;
      await utils.wait(200);
    } else if (applyCodeResponse.couponsandrewards) {
      await removeCodeCheckout(promoCode, applyCodeResponse, utils);
    }
  } else {
    const applyCodeResponse = await applyCodeCart(promoCode, utils);
    finalPrice = await updatePriceCart(applyCodeResponse, cartPriceSelector, originalPrice, utils);

    if (isApplyBest === true) {
      window.location = window.location.href;
      await utils.wait(200);
    } else if (applyCodeResponse.cartTotal) {
      await removeCodeCart(promoCode, applyCodeResponse, utils);
    }
  }

  // Return the final price as a number
  return Number(utils.parsePrice(finalPrice));
}

// Expose the function to the global scope
window.tacSubmit = tacSubmit;
