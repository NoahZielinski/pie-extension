async function applyCode(promoCode, utils) {
  try {
    const response = await $.ajax({
      url: 'https://www.belk.com/on/demandware.store/Sites-Belk-Site/default/Coupon-Validate',
      method: 'GET',
      data: {
        format: 'ajax',
        couponCode: promoCode,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  let couponDiscount = 0;
  try {
    if (applyCodeResponse.cpnDetails.isApplied) {
      const appliedCoupons = applyCodeResponse.cpnDetails.appliedCpns;
      const lastAppliedCoupon = appliedCoupons[appliedCoupons.length - 1];
      couponDiscount = lastAppliedCoupon.couponAmt;
      newPrice = Number(utils.parsePrice(originalPrice)) - Number(utils.parsePrice(couponDiscount));
    } else {
      newPrice = originalPrice;
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (newPrice < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  // if we're applying the best coupon, reload the page and wait for 2 seconds
  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(200);
  }

  // Return the final price
  return Number(utils.parsePrice(finalPrice));
}

// Assign the tacSubmit function to the global window object
window.tacSubmit = tacSubmit;
