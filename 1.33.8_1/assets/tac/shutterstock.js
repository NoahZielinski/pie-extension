let tacRunState;

async function fetchOrderId(utils) {
  const nextDataText = $('#__NEXT_DATA__').text();
  let orderId = tacRunState?.tacMemory?.orderId;

  try {
    const nextDataJson = JSON.parse(nextDataText);
    orderId = nextDataJson.query.orderId;
    tacRunState.tacMemory = { orderId };
  } catch (error) {
    utils.logger.debug(`Error fetching orderId: ${error}`);
  }
  return orderId;
}

async function applyCode(promoCode, utils) {
  const orderId = await fetchOrderId(utils);
  const orderData = {
    data: {
      attributes: {
        coupons: [
          {
            type: 'coupon',
            coupon_code: promoCode,
          },
        ],
      },
      type: 'orders',
    },
  };

  try {
    const response = await $.ajax({
      url: `https://www.shutterstock.com/papi/orders/${orderId}?include=invoices`,
      type: 'PATCH',
      headers: {
        accept: 'application/json',
      },
      contentType: 'application/json',
      data: JSON.stringify(orderData),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePrice(cartPriceSelector, originalPrice, utils) {
  const orderId = await fetchOrderId(utils);
  let newPrice;

  try {
    const priceResponse = await $.ajax({
      url: `https://www.shutterstock.com/papi/orders/${orderId}?include=invoices`,
      type: 'GET',
      headers: {
        accept: 'application/json',
      },
    });

    newPrice = priceResponse.data.attributes.total || originalPrice;
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

  tacRunState = runState;

  await applyCode(promoCode, utils);
  finalPrice = await updatePrice(cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(200);
  }

  // Return the final price
  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global scope
window.tacSubmit = tacSubmit;
