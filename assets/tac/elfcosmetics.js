let tacRunState;

// fetch basketId off of the coupon applier state
// if not found (happens for the first code), fetch it from the site's API
async function getBasketId(utils, siteId, authToken) {
  const cid = window.localStorage.getItem('cid');
  let basketId = tacRunState?.tacMemory?.basketId;

  if (!basketId) {
    const ajaxResponse = $.ajax({
      url: `/mobify/proxy/api/customer/shopper-customers/v1/organizations/f_ecom_bbxc_prd/customers/${cid}/baskets?siteId=${siteId}`,
      type: 'GET',
      headers: {
        Authorization: authToken,
      },
    });

    await ajaxResponse
      .done(() => {
        utils.logger.debug('Finished fetching basket ID');
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        utils.logger.debug(`Error fetching basket ID: ${errorThrown}`);
      });

    try {
      basketId = ajaxResponse.responseJSON.baskets[0].basketId;
      tacRunState.tacMemory = { basketId };
    } catch (error) {
      utils.logger.debug('Error fetching basket ID');
    }
  }

  return basketId;
}

async function applyCode(promoCode, utils, siteId, authToken) {
  const basketId = await getBasketId(utils, siteId, authToken);

  try {
    const response = await $.ajax({
      url: `/mobify/proxy/ocapi/s/${siteId}/dw/shop/v21_3/baskets/${basketId}/coupons`,
      type: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: authToken,
      },
      data: JSON.stringify({ code: promoCode }),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = applyCodeResponse.order_total;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(`$${newPrice.toFixed(2)}`);
  }

  return newPrice;
}

// Main function to apply coupon and get the lowest price
async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const siteId = window.localStorage.getItem('siteid');
  const authToken = window.localStorage.getItem('token');
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  tacRunState = runState;

  const applyCodeResponse = await applyCode(promoCode, utils, siteId, authToken);
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(200);
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    runState: tacRunState,
  };
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
