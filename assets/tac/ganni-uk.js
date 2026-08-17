async function applyCode(promoCode, utils) {
  const requestUrl = $('form.promo-code-form').attr('action') || '/en-gb/applycoupon';
  const token = $('form.promo-code-form input[name="csrf_token"]').val() || '';

  try {
    const response = await $.ajax({
      url: `${requestUrl}?csrf_token=${token}&couponCode=${promoCode}`,
      type: 'GET',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
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
  const requestUrl = $('button.delete-coupon-confirmation-btn').attr('data-action') || '/on/demandware.store/Sites-ganni-Site/en_GB/Cart-RemoveCouponLineItem';

  try {
    const response = await $.ajax({
      url: `${requestUrl}?code=${promoCode}&uuid=${uuid}`,
      type: 'GET',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
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

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (!applyCodeResponse?.error) {
    const uuid = await getUuid(applyCodeResponse, promoCode, utils);
    await removeCode(promoCode, uuid, utils);
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
