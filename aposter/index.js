Component({
	properties: {},

	data: {
		classess: '',
		show: false,
		display: false,
		posterSrc: ''
	},

	observers: {
		show(show) {
			if (show) {
				this.setData({
					display: true,
					classess: 'fade-in'
				});
			} else {
				this.setData({
					classess: 'fade-out'
				});
			}
		}
	},
	ready() {
		this.acanvas = this.selectComponent('#acanvasid');
	},

	methods: {
		showDialog(src) {
			this.setData({
				posterSrc: src,
				show: true
			});
		},
		closeDialog() {
			this.setData({
				show: false
			});
		},
		previewPoster() {
			const { posterSrc } = this.data;
			if (posterSrc) {
				wx.previewImage({
					current: posterSrc,
					urls: [ posterSrc ]
				});
			}
		},
		savePoster() {
			wx.getSetting({
				success: (res) => {
					if (!res.authSetting['scope.writePhotosAlbum']) {
						wx.authorize({
							scope: 'scope.writePhotosAlbum',
							success: () => {
								this.savePosterToAlbum();
							},
							fail: () => {
								wx.showToast({
									title: '保存失败',
									icon: 'none',
									duration: 1500,
									mask: false
								});
							}
						});
					} else {
						this.savePosterToAlbum();
					}
				},
				fail: () => {},
				complete: () => {}
			});
		},
		savePosterToAlbum() {
			wx.saveImageToPhotosAlbum({
				filePath: this.data.posterSrc,
				success: () => {
					wx.showToast({
						title: '已保存到相册，快去分享吧',
						icon: 'none',
						duration: 1500,
						mask: false
					});
				},
				fail: () => {
					wx.showToast({
						title: '保存失败',
						icon: 'none',
						duration: 1500,
						mask: false
					});
				},
				complete: () => {}
			});
		},
		genPoster(config) {
			const { autoHeight, productImg, showLoading = true, cb } = config;
			if (showLoading) {
				wx.showLoading({
					title: '合成中...',
					mask: true
				});
			}
			const acanvas = this.acanvas;

			Promise.resolve()
				.then(() => {
					if (autoHeight) {
						return acanvas.getImage({ src: productImg });
					} else {
						return Promise.resolve({ width: 375, height: 375 });
					}
				})
				.then((res) => {
					const rawImgW = res.width;
					const rawImgH = res.height;
					const canvasW = 375;
					let canvasH = 524;
					const productImgW = 375;
					let productImgH = 375;
					if (rawImgW !== rawImgH) {
						productImgH = rawImgH / (rawImgW / productImgW);
						canvasH = canvasH - 375 + productImgH;
					}
					return this.makePoster(
						Object.assign({}, config, { acanvas, canvasW, canvasH, productImgW, productImgH })
					);
				})
				.then((res) => {
					typeof cb === 'function' && cb(true);
					if (showLoading) {
						wx.hideLoading();
					}
					this.showDialog(res);
				})
				.catch((e) => {
					typeof cb === 'function' && cb(false);
					if (showLoading) {
						wx.hideLoading();
					}
					wx.showToast({
						title: '海报生成失败',
						icon: 'none',
						image: '',
						duration: 1500,
						mask: false
					});
				});
		},
		makePoster(config) {
			const {
				acanvas,
				canvasW,
				canvasH,
				productImg,
				productImgW,
				productImgH,
				title,
				price,
				avatar,
				motto,
				nickname,
				qrCode,
				genQrCode
			} = config;
			return new Promise((resolve, reject) => {
				acanvas.initCanvas({ width: canvasW, height: canvasH, backgroundColor: '#fff' }, () => {
					const promises = [];
					if (productImg) {
						promises.push(
							acanvas.drawImagePx({
								x: 0,
								y: 0,
								w: productImgW,
								h: productImgH,
								r: 0,
								bw: 0,
								src: productImg,
								mode: 'aspectFill'
							})
						);
					}
					if (avatar) {
						promises.push(
							acanvas.drawImagePx({
								x: 18,
								y: productImgH + 89,
								w: 40,
								h: 40,
								r: 20,
								bw: 0,
								src: avatar,
								mode: 'aspectFill'
							})
						);
					}

					if (qrCode) {
						if (genQrCode) {
							acanvas.drawQRCodePx({
								x: 296,
								y: productImgH + 61,
								w: 65,
								h: 65,
								text: qrCode
							});
						} else {
							promises.push(
								acanvas.drawImagePx({
									x: 296,
									y: productImgH + 61,
									w: 65,
									h: 65,
									r: 0,
									bw: 0,
									src: qrCode,
									mode: 'aspectFill'
								})
							);
						}
					}
					if (title) {
						acanvas.drawTextPx({
							x: 18,
							y: productImgH + 1,
							fontSize: 16,
							text: title,
							color: 'rgba(0,0,0,.6)',
							fontWeight: 500,
							fontFamily: 'system-ui',
							width: 345,
							lineNum: 2,
							lineHeight: 22,
							textDecoration: 'none',
							marginLeft: 0,
							marginRight: 0
						});
					}

					if (price) {
						acanvas.drawTextPx({
							x: 18,
							y: productImgH + 55,
							fontSize: 16,
							text: price,
							color: '#ec1731',
							opacity: 0.7,
							fontWeight: 500,
							fontFamily: 'system-ui',
							width: 180,
							lineNum: 2,
							lineHeight: 22,
							textDecoration: 'none',
							marginLeft: 0,
							marginRight: 0
						});
					}

					if (nickname) {
						acanvas.drawTextPx({
							x: 64,
							y: productImgH + 83,
							fontSize: 11,
							text: `好友${nickname}`,
							color: 'rgba(0,0,0,.6)',
							opacity: 1,
							fontWeight: 500,
							fontFamily: 'system-ui',
							width: 200,
							lineNum: 1,
							lineHeight: 22,
							textDecoration: 'none',
							marginLeft: 0,
							marginRight: 0
						});
					}

					if (motto) {
						acanvas.drawTextPx({
							x: 64,
							y: productImgH + 101,
							fontSize: 10,
							text: motto,
							color: '#929292',
							opacity: 0.7,
							fontWeight: 500,
							fontFamily: 'system-ui',
							width: 200,
							lineNum: 1,
							lineHeight: 22,
							textDecoration: 'none',
							marginLeft: 0,
							marginRight: 0
						});
					}

					acanvas.drawTextPx({
						x: 308,
						y: productImgH + 127,
						fontSize: 10,
						text: '长按识别',
						color: '#929292',
						fontFamily: 'system-ui',
						width: 60,
						lineNum: 1,
						lineHeight: 12,
						textDecoration: 'none',
						marginLeft: 0,
						marginRight: 0
					});

					Promise.all(promises)
						.then(() => {
							return resolve(acanvas.canvasToTempFilePath({ fileType: 'jpg' }));
						})
						.catch(() => {
							return reject(new Error('Make poster fail'));
						});
				});
			});
		},

		animationend() {
			if (!this.data.show) {
				this.setData({
					display: false
				});
			}
		},
		noop() {}
	}
});
