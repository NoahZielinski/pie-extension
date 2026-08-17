async function applyOrRemoveCode(promoCode, utils, action, applyCodeResponse) {
  let serializedForm;
  let requestUrl;
  if (action === 'apply') {
    serializedForm = $('#frmApplyCoupon').serialize();
    requestUrl = '/xhr/handler.jsp?_DARGS=/checkout/includes/coupon-form.jsp.frmApplyCoupon';
  } else {
    serializedForm = $(applyCodeResponse).find('#removeCoupon').serialize();
    requestUrl = '/includes/submit.jsp?_DARGS=/checkout/includes/coupon-form.jsp';
  }

  const ajaxResponse = $.ajax({
    url: requestUrl,
    type: 'POST',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'content-type': 'application/x-www-form-urlencoded',
    },
    data: serializedForm,
  });

  await ajaxResponse
    .done(() => {
      utils.logger.debug(`Finished ${action} code action`);
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      utils.logger.debug(`Coupon ${action} error: ${errorThrown}`);
    });

  if (action === 'apply') {
    const cartReponse = $.ajax({
      url: '/checkout',
      type: 'GET',
    });

    await cartReponse
      .done(() => {
        utils.logger.debug('Finished fetching cart');
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        utils.logger.debug(`Cart fetching error: ${errorThrown}`);
      });

    return cartReponse;
  }
  return '';
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = $(applyCodeResponse).find(cartPriceSelector).text();
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

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);
  await applyOrRemoveCode(promoCode, utils, 'remove', applyCodeResponse);

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Expose the tacSubmit function to the global scope
window.tacSubmit = tacSubmit;
