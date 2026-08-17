async function testCode(promoCode, utils, action) {
  // seems like this skips the captcha
  $('.rtContent  #skipCaptchaFlag').val('true');

  const orderId = $('#orderId').val() || '';
  const storeId = (window.location.href.match(/storeId=([^?&]+)?/) || [])[1] || '10151';
  const catalogId = (window.location.href.match(/catalogId=([^?&]+)?/) || [])[1] || '10051';
  const langId = (window.location.href.match(/langId=([^?&]+)?/) || [])[1] || '-1';

  const cartParams = $('script:contains(cartParams)').text();
  const cal = (cartParams.match(/'cal'\s?:\s?'([^,'}]+)?'/) || [])[1] || '6000';
  const cql = (cartParams.match(/'cql'\s?:\s?'([^,'}]+)?'/) || [])[1] || '40';
  const ccf = (cartParams.match(/'ccf'\s?:\s?'([^,'}]+)?'/) || [])[1] || 'false';

  const taskType = action === 'apply' ? 'A' : 'R';

  try {
    const response = await $.ajax({
      url: '/us-en/shop/AjaxPromotionCodeManage',
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      data: {
        token: 'NA',
        finalView: 'AjaxOrderItemDisplayView',
        taskType,
        storeId,
        catalogId,
        langId,
        orderId,
        promoCode,
        cal,
        cql,
        ccf,
      },
    });

    utils.logger.debug(`Finishing testing coupon action ${action}`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error testing coupon action ${action}: ${error}`);
    return null;
  }
}

async function applyOrRemoveCode(promoCode, utils, action) {
  const orderId = $('#orderId').val() || '';
  const calculationUsage = $('[name="calculationUsage"]').val() || '';
  const storeId = (window.location.href.match(/storeId=([^?&]+)?/) || [])[1] || '10151';
  const catalogId = (window.location.href.match(/catalogId=([^?&]+)?/) || [])[1] || '10051';
  const langId = (window.location.href.match(/langId=([^?&]+)?/) || [])[1] || '-1';

  const cartParams = $('script:contains(cartParams)').text();
  const cal = (cartParams.match(/'cal'\s?:\s?'([^,'}]+)?'/) || [])[1] || '6000';
  const cql = (cartParams.match(/'cql'\s?:\s?'([^,'}]+)?'/) || [])[1] || '40';
  const ccf = (cartParams.match(/'ccf'\s?:\s?'([^,'}]+)?'/) || [])[1] || 'false';

  const taskType = action === 'apply' ? 'A' : 'R';

  try {
    const response = await $.ajax({
      url: '/us-en/shop/AjaxOrderChangeServiceItemUpdate',
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      data: {
        token: 'NA',
        'tasktype[]': taskType,
        orderid: orderId,
        calculationUsage,
        storeId,
        catalogId,
        langId,
        promoCode,
        cal,
        cql,
        ccf,
      },
    });

    utils.logger.debug(`Finishing coupon ${action} action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on coupon ${action}: ${error}`);
    return null;
  }
}

async function getCart(utils) {
  const storeId = (window.location.href.match(/storeId=([^?&]+)?/) || [])[1] || '10151';
  const catalogId = (window.location.href.match(/catalogId=([^?&]+)?/) || [])[1] || '10051';
  const langId = (window.location.href.match(/langId=([^?&]+)?/) || [])[1] || '-1';

  const cartParams = $('script:contains(cartParams)').text();
  const cal = (cartParams.match(/'cal'\s?:\s?'([^,'}]+)?'/) || [])[1] || '6000';
  const cql = (cartParams.match(/'cql'\s?:\s?'([^,'}]+)?'/) || [])[1] || '40';
  const ccf = (cartParams.match(/'ccf'\s?:\s?'([^,'}]+)?'/) || [])[1] || 'false';

  try {
    const response = await $.ajax({
      url: `/us-en/shop/RefreshCart?ajax=true&storeId=${storeId}&catalogId=${catalogId}&langId=${langId}&cal=${cal}&cql=${cql}&ccf=${ccf}`,
      type: 'GET',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      data: {
        storeId,
        catalogId,
        langId,
        cal,
        cql,
        ccf,
      },
    });

    utils.logger.debug('Finishing fetching cart');
    return response;
  } catch (error) {
    utils.logger.debug(`Error fetching cart: ${error}`);
    return null;
  }
}

function updatePrice(cartResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const priceString = $(cartResponse).find(cartPriceSelector).text() || originalPrice;
    newPrice = Number(utils.parsePrice(priceString));
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

  const testCodeResponse = await testCode(promoCode, utils, 'apply');
  const isCodeValid = !testCodeResponse.includes('errorMessage');

  if (isCodeValid) {
    await applyOrRemoveCode(promoCode, utils, 'apply');
    const cartResponse = await getCart(utils);
    finalPrice = updatePrice(cartResponse, cartPriceSelector, originalPrice, utils);
  } else {
    finalPrice = originalPrice;
  }

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(500);
  } else if (isCodeValid) {
    await testCode(promoCode, utils, 'remove');
    await applyOrRemoveCode(promoCode, utils, 'remove');
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
