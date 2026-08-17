async function applyOrRemoveCode(promoCode, utils, action, applyCodeResponse = '') {
  const ADD_COUPON_BASE_URL = 'https://www.loft.com/on/demandware.store/Sites-Loft-Site/default/Cart-AddCoupon';
  const REMOVE_COUPON_BASE_URL = 'https://www.loft.com/on/demandware.store/Sites-Loft-Site/default/Cart-RemoveCouponLineItem';
  const csrfVal = $('.promo-code-form-premium [name="csrf_token"]').val();
  const addCouponUrl = `${ADD_COUPON_BASE_URL}?couponCode=${promoCode}&csrf_token=${csrfVal}`;
  let removeCouponUrl;

  if (action === 'remove') {
    try {
      const couponUUID = applyCodeResponse.totals.discounts.filter((discount) => discount.couponCode.toUpperCase() === promoCode.toUpperCase())[0].UUID;
      removeCouponUrl = `${REMOVE_COUPON_BASE_URL}?code=${promoCode}&uuid=${couponUUID}&_=${Date.now()}`;
    } catch (error) {
      utils.logger.debug(`Coupon remove error: ${error}`);
    }
  }

  const requestUrl = action === 'apply' ? addCouponUrl : removeCouponUrl;

  try {
    const response = await $.ajax({
      url: requestUrl,
      type: 'GET',
    });

    utils.logger.debug(`Finished running ${action} code`);
    return response;
  } catch (error) {
    utils.logger.debug(`Coupon ${action} error: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    newPrice = applyCodeResponse.totals.subTotal;
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
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (!isApplyBest) {
    await applyOrRemoveCode(promoCode, utils, 'remove', applyCodeResponse);
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Expose the function to the global scope
window.tacSubmit = tacSubmit;
