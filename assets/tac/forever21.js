async function applyCode(promoCode, utils) {
  const csrfToken = $('input[name*=csrf_token]').val();

  try {
    const response = await $.ajax({
      url: 'https://www.forever21.com/on/demandware.store/Sites-forever21-Site/en_US/Cart-AddCoupon',
      method: 'POST',
      headers: {
        'content-encoding': 'gzip',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        vary: 'accept-encoding',
      },
      data: {
        csrf_token: csrfToken,
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

async function removeCode(priceResponse, promoCode, utils) {
  const couponCodeUpperCase = promoCode.toUpperCase();
  const couponCodeLowerCase = promoCode.toLowerCase();
  const couponButtonUuid = $(priceResponse.responseText)
    .find(`button[data-code="${couponCodeLowerCase}"], button[data-code="${couponCodeUpperCase}"]`)
    .attr('data-uuid');
  if (couponButtonUuid) {
    const removeCouponResponse = $.ajax({
      url: `/on/demandware.store/Sites-forever21-Site/en_US/Cart-RemoveCouponLineItem?code=${promoCode}&uuid=${couponButtonUuid}`,
      method: 'GET',
      headers: {
        'content-encoding': 'gzip',
        'content-type': 'application/json',
        vary: 'accept-encoding',
      },
    });

    await removeCouponResponse
      .done(() => {
        utils.logger.debug('Finished removing code');
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        utils.logger.debug(`Coupon remove error: ${errorThrown}`);
      });
  }
}

async function updatePrice(priceResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = $(priceResponse).find(cartPriceSelector).text();
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
  const priceResponse = await $.get(window.location.href);
  finalPrice = await updatePrice(priceResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(200);
  } else {
    await removeCode(priceResponse, promoCode, utils);
  }
  return Number(utils.parsePrice(finalPrice));
}

// Expose the function to the global scope
window.tacSubmit = tacSubmit;
