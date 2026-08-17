async function applyCode(promoCode, utils) {
  try {
    const response = await $.ajax({
      url: 'https://www.carid.com/cart.php',
      type: 'POST',
      data: {
        coupon: promoCode,
        mode: 'add_coupon',
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(utils) {
  const removeCodeResponse = $.ajax({
    url: 'https://www.carid.com/cart.php?mode=unset_coupons',
    type: 'GET',
  });

  await removeCodeResponse
    .done(() => {
      utils.logger.debug('Finished removing code');
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      utils.logger.debug(`Coupon remove error: ${errorThrown}`);
    });
}

async function updatePrice(cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const ajaxResponse = await $.ajax({
      url: window.location.href,
      type: 'GET',
    });

    newPrice = $(ajaxResponse).find(cartPriceSelector).text();
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
  finalPrice = await updatePrice(cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(200);
  } else {
    await removeCode(utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
