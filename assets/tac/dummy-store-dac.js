async function applyCode(promoCode, utils) {
  const ajaxResponse = $.ajax({
    url: `https://cdn.joinhoney.com/dummy-store/api/${promoCode}.json`,
    type: 'GET',
  });

  await ajaxResponse
    .done(() => {
      utils.logger.debug('Finished applying code');
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      utils.logger.debug(`Coupon apply error: ${errorThrown}`);
    });

  return ajaxResponse;
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.price;
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
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

window.tacSubmit = tacSubmit;
