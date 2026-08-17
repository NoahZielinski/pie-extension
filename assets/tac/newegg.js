function generateNonce(length = 32) {
  // Create array of hex characters
  const hex = '0123456789abcdef';
  
  // Generate random hex string
  return Array.from(
      { length },
      () => hex[Math.floor(Math.random() * 16)]
  ).join('');
}

async function applyCode(promoCode, utils) {
    // Request-based implementation for checkout flow
    const sessionId = (
        window.location.href.match(/sessionId=([^&]+)/) || 
        ($(`[src*=sessionId]`).attr('src') && $(`[src*=sessionId]`).attr('src').match(/sessionId%3D([^%]+)/)) || 
        []
    )[1] || '';
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = generateNonce();
    
    try {
        const response = await $.ajax({
            url: `https://secure.newegg.com/shop/api/${window.location.pathname.includes('checkout') ? 'InitOrderReviewApi' : 'InitCartApi'}?timestamp=${timestamp}&nonce=${nonce}&appId=107630`,
            method: 'POST',
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json",
                "x-ne-sign": "1",
                "x-ne-sign-type": "simple",
                "x-page-name": window.location.pathname,
                "x-requested-with": "XMLHttpRequest",
                "x-sessionid": sessionId
            },
            data: JSON.stringify({
                "SessionID": sessionId,
                "Actions": [{
                    "ActionType": "InputPCode",
                    "JsonContent": `{"ActionType":"InputPCode","Append":[{"PCode":"${promoCode}"}]}`
                }],
                "EnableAsyncToken": true,
                "BrowserName": "Chrome"
            })
        });

        utils.logger.debug('Finishing applying coupon');
        return response;
    } catch (error) {
      utils.logger.debug(`Error applying coupon: ${error}`);
      return null;
    }
  }

// update price based on the response
async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const parsedResponse = JSON.parse(applyCodeResponse);
    newPrice = parsedResponse.SummaryInfo.GrandTotal;
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
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(200);
  }

  return Number(utils.parsePrice(finalPrice));
}
  window.tacSubmit = tacSubmit;
