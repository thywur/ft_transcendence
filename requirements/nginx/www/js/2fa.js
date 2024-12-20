async function activate_2fa() {
	const access_token = getTokenCookie();
	const userInfo = await getUserInfo(access_token);

	if (userInfo.is_2FA) {
		try {
			const response = await fetch('auth/2FA/desactivate/', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${access_token}`,
				}
			});

			if (response.ok) {
				const data = await response.json();
				if (data.message === 'Success') {
					raiseAlert('2FA has been succesfully desactivated');
					return ;
				} else {
					raiseAlert('activate_2fa: ' + data.message);
				}
			} else {
				const errorData = await response.json();
				if (errorData.message === 'failed : access_token is invalid' || errorData.message === 'failed : access_token is expired') {
					const isRefreshed = await getRefreshToken();
					if (isRefreshed) {
						const new_token = getTokenCookie();
						return await getUserInfo(new_token);
					}
				} else {
					raiseAlert('Getuser:' + errorData.message);
				}
			}
		} catch(error) {
			console.log(error);
		}
		return ;
	}

	try {
		const response = await fetch('/auth/2FA/activate/', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${access_token}`,
			  },
		});

		if (response.ok) {
			const data = await response.json();
			if (data.message === 'Success') {
				img_path = data.qrcode_path;
			} else {
				raiseAlert(data.message);
			}
		} else {
			const errorData = await response.json();
			if (errorData.message === 'failed : access_token is invalid' || errorData.message === 'failed : access_token is expired') {
				const isRefreshed = await getRefreshToken();
				if (isRefreshed) {
					const new_token = getTokenCookie();
					return await getUserInfo(new_token);
				}
			}
		}
	} catch (error) {
		console.error(error);
	}

	const win_2fa = document.querySelector('#activate-2fa');
	const win_2fa_content = win_2fa.querySelector('.window-content');
	win_2fa.style.display = 'flex';

	const img = win_2fa_content.querySelector('img');
	img.src = img_path;
}

document.addEventListener("DOMContentLoaded", () => {
	const access_token = getTokenCookie();
	const winActivate2FA = document.querySelector('#activate-2fa');
	const content = winActivate2FA.querySelector('.window-content');
	const buttonValidate2FA = content.querySelector('#validate-qr-code-id');

	buttonValidate2FA.addEventListener('click', async function () {
		const inputCode = content.querySelector('input');
		const code = inputCode.value.trim();

		const requestData = {
			otp_code: code
		};

		try {
			const response = await fetch('/auth/2FA/activate/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${access_token}`,
				  },
				body: JSON.stringify(requestData)
			});
			if (response.ok) {
				const data = await response.json();
				if (data.message === 'Success') {
					inputCode.innerHTML = '';
					raiseAlert('2FA is activated.')
				} else {
					raiseAlert(data.message);
				}
			} else {
				const errorData = await response.json();
				if (errorData.message === 'failed : access_token is invalid' || errorData.message === 'failed : access_token is expired') {
					const isRefreshed = await getRefreshToken();
					if (isRefreshed) {
						const new_token = getTokenCookie();
						return await getUserInfo(new_token);
					}
				}
			}
		} catch (error) {
			console.log(error);
		}
	});
});

const win_2fa = document.getElementById('activate-2fa');
win_2fa.querySelector('.close-button').addEventListener('click', function() {
	win_2fa.style.display = 'none';
});
