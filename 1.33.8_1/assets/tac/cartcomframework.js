async function applyCode(utils) {
  const formData = $($('form input[value="Apply Code"]')[0]?.form)?.serialize() || '';

  try {
    const response = await $.ajax({
      url: '/store/shopcart.aspx',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: `${formData}&ctl31%24btnAddCoupon=Apply+Code`,
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePrice(cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    const response = await $.ajax({
      url: window.location.href,
      type: 'GET',
    });
    newPrice = $(response).find(cartPriceSelector).text();
    if (!newPrice) {
      newPrice = response.match(/data-pp-amount="(\d+\.\d+)"/)?.[1];
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;
  await applyCode(utils);
  finalPrice = await updatePrice(cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(200);
  }

  return Number(utils.parsePrice(finalPrice));
}

window.tacSubmit = tacSubmit;
