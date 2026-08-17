async function applyOrRemoveCodeCart(promoCode, utils, action) {
  const requestUrl = $('form[name*="dwfrm_cart_"]').attr('action');
  const requestData = {};

  if (action === 'apply') {
    requestData.dwfrm_cart_addCoupon = 'dwfrm_cart_addCoupon';
    requestData.dwfrm_cart_couponCode = promoCode;
  } else {
    requestData.dwfrm_cart_couponCode = '';
    requestData.dwfrm_cart_coupons_i0_deleteCoupon = 'Remove';
  }

  try {
    // have to append the of each item to the request
    // if you don't it empties the cart instead of applying the coupon :D
    const quantityElements = $('select[name*="dwfrm_cart_shipments_i"][name*="_quantity"]');

    // eslint-disable-next-line no-restricted-syntax
    for (const element of quantityElements) {
      const quantityName = $(element).attr('name');
      const quantityValue = $(element).attr('data-qty');
      requestData[quantityName] = quantityValue;
    }

    const response = await $.ajax({
      url: requestUrl,
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: requestData,
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon action: ${error}`);
    return null;
  }
}

function updatePriceCart(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
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

async function applyOrRemoveCodeCheckout(promoCode, utils, action) {
  const couponAction = action === 'apply' ? 'Cart-AddCouponJson' : 'COBilling-RemoveCouponJson';
  const requestUrl = `/on/demandware.store/Sites-llbeancanada-Site/default/${couponAction}?couponCode=${promoCode}&format=ajax`;
  try {
    const response = await $.ajax({
      url: requestUrl,
      type: 'GET',
      data: {
        couponCode: promoCode,
        format: 'ajax',
      },
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon action: ${error}`);
    return null;
  }
}

async function updatePriceCheckout(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.baskettotal;
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

  const isCheckout = $('#dwfrm_billing').length > 0;

  if (isCheckout) {
    const applyCodeResponse = await applyOrRemoveCodeCheckout(promoCode, utils, 'apply');
    finalPrice = await updatePriceCheckout(applyCodeResponse, cartPriceSelector, originalPrice, utils);

    if (!isApplyBest && applyCodeResponse?.success === true) {
      await applyOrRemoveCodeCheckout(promoCode, utils, 'remove');
    }
  } else {
    const applyCodeResponse = await applyOrRemoveCodeCart(promoCode, utils, 'apply');
    finalPrice = updatePriceCart(applyCodeResponse, cartPriceSelector, originalPrice, utils);

    if (!isApplyBest) {
      await applyOrRemoveCodeCart(promoCode, utils, 'remove');
    }
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
