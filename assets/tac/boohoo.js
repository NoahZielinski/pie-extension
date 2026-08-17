async function applyCode(promoCode, utils) {
  const requestUrl = $('form[name="promo-code-form"]').attr('action') || '/on/demandware.store/Sites-boohoo-UK-Site/en_GB/Cart-AddCoupon?source=checkout';
  const token = $('[data-token-name="csrf_token"]').attr('data-token-value') || '';

  try {
    const response = await $.ajax({
      url: `${requestUrl}?ajax=true`,
      type: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: {
        csrf_token: token,
        dwfrm_coupon_couponCode: promoCode,
        sources: 'global,checkout',
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function getUuid(applyCodeResponse, promoCode, utils) {
  let uuid = '';

  try {
    const discountsArray = applyCodeResponse?.totals?.discounts || [];
    const promoCodeToFind = promoCode.toUpperCase();

    const couponKey = Object.keys(discountsArray || {}).find((key) => discountsArray[key]?.couponCode.toUpperCase() === promoCodeToFind);
    uuid = discountsArray[couponKey]?.UUID;
  } catch (error) {
    utils.logger.debug(`Error getting uuid: ${error}`);
  }

  return uuid;
}

async function removeCode(promoCode, uuid, utils) {
  const requestUrl =
    $('form[name="promo-code-form"]').attr('data-remove-coupon-url') ||
    '/on/demandware.store/Sites-boohoo-UK-Site/en_GB/Cart-RemoveCouponLineItem?source=checkout';
  const token = $('[data-token-name="csrf_token"]').attr('data-token-value') || '';

  try {
    const response = await $.ajax({
      url: `${requestUrl}?ajax=true`,
      type: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: {
        csrf_token: token,
        couponCode: '',
        uuid,
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
    const priceString = applyCodeResponse?.totals?.grandTotal;
    newPrice = Number(utils.parsePrice(priceString)) || originalPrice;
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
  } else if (!applyCodeResponse?.error) {
    const uuid = await getUuid(applyCodeResponse, promoCode, utils);
    await removeCode(promoCode, uuid, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
