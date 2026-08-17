async function getUuids(utils) {
  const couponsAndIds = [];
  try {
    const response = await $.ajax({
      url: window.location.href,
      type: 'GET',
    });

    utils.logger.debug('Getting coupon uuid');
    const appliedCouponElements = $(response).find('button.remove-coupon');

    // eslint-disable-next-line no-restricted-syntax
    for (const appliedCoupon of appliedCouponElements) {
      const coupon = $(appliedCoupon).attr('data-code');
      const uuid = $(appliedCoupon).attr('data-uuid');

      if (coupon && uuid) {
        couponsAndIds.push({ coupon, uuid });
      }
    }
  } catch (error) {
    utils.logger.debug(`Error getting coupon uuid ${error}`);
  }
  return couponsAndIds;
}

async function applyOrRemoveCode(promoCode, utils, action, uuid) {
  const APPLY_CODE_URL = '/on/demandware.store/Sites-World_Market-Site/en_US/Cart-ApplyCoupon';
  const REMOVE_CODE_URL = '/on/demandware.store/Sites-World_Market-Site/en_US/Cart-RemoveCouponLineItem';
  const csrfToken = $('input[name*=csrf_token]').val();
  const requestUrl =
    action === 'apply' ? `${APPLY_CODE_URL}?couponCode=${promoCode}&csrf_token=${csrfToken}` : `${REMOVE_CODE_URL}?code=${promoCode}&uuid=${uuid}`;

  try {
    const response = await $.ajax({
      url: `${requestUrl}`,
      type: 'GET',
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.totals.grandTotalValue || originalPrice;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacPreApply({ utils }) {
  const couponsAndIds = await getUuids(utils);
  const removalPromises = [];

  if (!couponsAndIds.length) {
    return;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const coupon of couponsAndIds) {
    removalPromises.push(applyOrRemoveCode(coupon.coupon, utils, 'remove', coupon.uuid));
  }

  await Promise.all(removalPromises);
  window.location = window.location.href;
  await utils.wait(800);
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(200);
  } else if (applyCodeResponse && applyCodeResponse.error !== true) {
    const couponsAndIds = await getUuids(utils);
    const appliedCoupon = couponsAndIds.filter((obj) => obj.coupon.toLowerCase() === promoCode.toLowerCase());
    await applyOrRemoveCode(promoCode, utils, 'remove', appliedCoupon.uuid);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign tacSubmit function to the global window object
window.tacSubmit = tacSubmit;
window.tacPreApply = tacPreApply;
