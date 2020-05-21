import qrjs, { ErrorCorrectLevel } from './qr.js/index';
/**
 * 字符串转换成 UTF-8
 * @param {String} str 文本内容
 */
const utf16to8 = (str) => {
	const len = str.length;
	let out = '';

	for (let i = 0; i < len; i++) {
		const c = str.charCodeAt(i);

		if (c >= 0x0001 && c <= 0x007f) {
			out += str.charAt(i);
		} else if (c > 0x07ff) {
			out += String.fromCharCode(0xe0 | ((c >> 12) & 0x0f));
			out += String.fromCharCode(0x80 | ((c >> 6) & 0x3f));
			out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
		} else {
			out += String.fromCharCode(0xc0 | ((c >> 6) & 0x1f));
			out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
		}
	}

	return out;
};
Component({
	properties: {
		debug: {
			type: Boolean,
			value: false
		}
	},
	data: {
		width: 10,
		height: 10
	},

	ready() {
		this.systemInfo = wx.getSystemInfoSync();
		this.initCanvas({});
	},

	methods: {
		initCanvas({ width = 10, height = 10, backgroundColor = 'white' }) {
			this.clearCtx();
			return new Promise((resolve, reject) => {
				this.setData(
					{
						width,
						height
					},
					() => {
						this.createSelectorQuery()
							.select('#acanvasid')
							.fields({ node: true, size: true })
							.exec((res) => {
								// Canavas size can not exceed the limit
								try {
									const canvas = res[0].node;
									const ctx = canvas.getContext('2d');
									let dpr = this.systemInfo.pixelRatio;
									let cW = res[0].width;
									let cH = res[0].height;
									if (this.systemInfo.platform === 'android') {
										if (dpr * cH >= 2000 || dpr * cW >= 2000) {
											dpr = 1.5;
										}
									}
									canvas.width = cW * dpr;
									canvas.height = cH * dpr;
									ctx.scale(dpr, dpr);
									this.dpr = dpr;
									this.canvas = canvas;
									this.ctx = ctx;
									this.ctx.save();
									this.ctx.fillStyle = backgroundColor;
									this.ctx.fillRect(0, 0, width * dpr, height * dpr);
									this.ctx.restore();
									return resolve({ width, height });
								} catch (error) {
									console.log(error);
									return reject(error);
								}
							});
					}
				);
			});
		},
		drawRectPx({ ctx = this.ctx, x, y, w, h, r = 0, lw = 1, color = 'black', opacity = 1, fill, clip = false }) {
			ctx.save();
			ctx.beginPath();
			if (!clip) {
				if (fill) {
					ctx.fillStyle = color;
				} else {
					ctx.lineWidth = lw;
					ctx.strokeStyle = color;
				}
			}
			ctx.globalAlpha = opacity;
			ctx.moveTo(x + r, y);
			ctx.lineTo(x + w - r, y);
			if (r) {
				ctx.arcTo(x + w, y, x + w, y + r, r);
			}
			ctx.lineTo(x + w, y + h - r);
			if (r) {
				ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
			}
			ctx.lineTo(x + r, y + h);
			if (r) {
				ctx.arcTo(x, y + h, x, y + h - r, r);
			}
			ctx.lineTo(x, y + r);
			if (r) {
				ctx.arcTo(x, y, x + r, y, r);
			}
			if (!clip) {
				if (fill) {
					ctx.fill();
				} else {
					ctx.stroke();
				}
			} else {
				ctx.clip();
			}
			ctx.restore();
		},
		drawImagePx({
			ctx = this.ctx,
			canvas = this.canvas,
			x,
			y,
			w,
			h,
			r = 0, // radius
			bw = 0, // borderWidth
			bc = 'black', //  boderColor
			src,
			mode = 'scaleToFill' // scaleToFill; aspectFit; aspectFill
		}) {
			const img = canvas.createImage();
			img.src = src;
			return new Promise((resolve, reject) => {
				img.onload = () => {
					const imgW = img.width;
					const imgH = img.height;
					ctx.save();
					this.drawRectPx({ x, y, w, h, r, lw: bw, color: bc, clip: true });
					if (r) {
						ctx.clip();
					}
					switch (mode) {
						case 'aspectFit':
							this.aspectFitImg(ctx, x, y, w, h, img, imgW, imgH);
							break;
						case 'aspectFill':
							this.aspectFillImg(ctx, x, y, w, h, img, imgW, imgH);
							break;
						default:
							ctx.drawImage(img, x, y, w, h);
							break;
					}
					ctx.restore();
					return resolve(img);
				};
				img.onerror = () => {
					wx.showToast({
						title: '图片下载失败',
						icon: 'none',
						image: '',
						duration: 1500,
						mask: false
					});
					return reject(new Error('Download image fail'));
				};
			});
		},
		drawTextPx({
			ctx = this.ctx,
			x,
			y,
			text,
			fontSize = 13,
			color = 'black',
			textDecoration = 'none',
			textDecorationWdith = 1,
			textDecorationColor = 'black',
			fontWeight = 'normal',
			fontStyle = 'normal',
			fontFamily = 'sans-serif',
			lineNum = 1,
			lineHeight = 0,
			marginLeft = 0,
			marginRight = 1,
			opacity = 1,
			width = 0
		}) {
			ctx.save();
			ctx.beginPath();
			ctx.font = `${fontStyle} ${fontWeight}  ${fontSize}px ${fontFamily}`;
			ctx.globalAlpha = opacity;
			ctx.fillStyle = color;
			let textWidth = this.calcTextWidth({ text, fontSize, marginLeft, marginRight });
			const fillTexts = [];
			let line = 0;
			if (textWidth > width) {
				let fillText = '';
				for (let i = 0; i < text.length; i++) {
					if (line < lineNum) {
						fillText = fillText + text[i];
						if (marginLeft + marginRight + ctx.measureText(fillText).width > width) {
							fillText = fillText.substring(0, fillText.length - 1);
							if (line === lineNum - 1) {
								fillText = fillText.substring(0, fillText.length - 1) + '...';
								fillTexts.push(fillText);
								break;
							}
							fillTexts.push(fillText);
							fillText = '';
							line++;
						}
					} else {
						break;
					}
				}
			} else {
				fillTexts.push(text);
			}
			fillTexts.forEach((item, index) => {
				const lineY = y + (lineHeight || fontSize) * (index + 1);
				const textWidth = ctx.measureText(item).width;
				ctx.fillText(item, x + marginLeft, lineY);
				if (textDecoration === 'line-through') {
					ctx.save();
					ctx.strokeStyle = textDecorationColor;
					ctx.lineWidth = textDecorationWdith;
					ctx.moveTo(x + marginLeft, lineY - fontSize / 2);
					ctx.lineTo(x + marginLeft + textWidth, lineY - fontSize / 2);
					ctx.stroke();
					ctx.restore();
				}
			});
			ctx.restore();
		},
		drawQRCodePx({
			x = 0,
			y = 0,
			ctx = this.ctx,
			tn = -1, // type number
			eccl = 2, // error correction capacity level
			w,
			h,
			fc = '#000', // front ground color
			bc = '#fff', // back ground color
			text
		}) {
			const qrcode = qrjs(utf16to8(text), {
				tn,
				eccl
			});
			const cells = qrcode.modules;
			const tileW = w / cells.length;
			const tileH = h / cells.length;

			cells.forEach((row, rdx) => {
				row.forEach((cell, cdx) => {
					ctx.fillStyle = cell ? fc : bc;
					const bw = Math.ceil((cdx + 1) * tileW) - Math.floor(cdx * tileW);
					const bh = Math.ceil((rdx + 1) * tileH) - Math.floor(rdx * tileH);
					ctx.fillRect(Math.round(cdx * tileW + x), Math.round(rdx * tileH + y), bw, bh);
				});
			});
		},
		calcTextWidth({ ctx = this.ctx, text, fontSize, marginLeft = 0, marginRight = 0 }) {
			ctx.fontSize = fontSize;
			const width = ctx.measureText(text).width + marginLeft + marginRight;
			return width;
		},
		aspectFitImg(ctx, x, y, w, h, img, imgW, imgH) {
			const wR = w / imgW;
			const hR = h / imgH;
			ctx.save();
			if (imgW > imgH) {
				let taH = wR * imgH;
				let taW = w;
				let yOffset = 0;
				let xOffset = 0;
				if (taH > h) {
					taW = w * (h / taH);
					taH = h;
					xOffset = (w - taW) / 2;
				} else {
					yOffset = (h - taH) / 2;
				}
				ctx.drawImage(img, x + xOffset, y + yOffset, taW, taH);
			} else {
				let taW = hR * imgW;
				let taH = h;
				let yOffset = 0;
				let xOffset = 0;
				if (taW > w) {
					taH = h * (w / taW);
					taW = w;
					yOffset = (h - taH) / 2;
				} else {
					xOffset = (w - taW) / 2;
				}
				ctx.drawImage(img, x + xOffset, y + yOffset, taW, taH);
				ctx.restore();
			}
		},
		aspectFillImg(ctx, x, y, w, h, img, imgW, imgH) {
			const wR = w / imgW;
			const hR = h / imgH;
			let taW = 0;
			let taH = 0;
			let imgOffsetX = 0;
			let imgOffsetY = 0;
			ctx.save();
			ctx.clip();
			if (w > h) {
				taW = w;
				taH = imgH * wR;
				if (taH < h) {
					taH = h;
					taW = imgW * hR;
					imgOffsetX = (taW - w) / 2 / hR;
				}
				if (taH > h) {
					imgOffsetY = (taH - h) / 2 / wR;
				}
			} else {
				taH = h;
				taW = imgW * hR;
				if (taW < w) {
					taW = w;
					taH = imgH * wR;
					imgOffsetY = (taH - h) / 2 / wR;
				}
				if (taW > w) {
					imgOffsetX = (taW - w) / 2 / hR;
				}
			}
			ctx.drawImage(img, imgOffsetX, imgOffsetY, imgW, imgH, x, y, taW, taH);
			ctx.restore();
		},
		getImage({ canvas = this.canvas, src }) {
			return new Promise((resolve, reject) => {
				const img = canvas.createImage();
				img.src = src;
				img.onload = () => {
					return resolve(img);
				};
				img.onerror = () => {
					return reject(new Error('Download image fail'));
				};
			});
		},
		clearCtx() {
			if (this.ctx) {
				this.ctx.setTransform(1, 0, 0, 1, 0, 0);
				this.ctx.beginPath();
				this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			}
		},
		canvasToTempFilePath({ canvas = this.canvas, fileType = 'jpg' }) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					wx.canvasToTempFilePath({
						canvas: canvas,
						fileType: fileType,
						quality: 1,
						success: (res) => {
							resolve(res.tempFilePath);
							this.clearCtx();
						},
						fail: (e) => {
							this.clearCtx();
							reject(e);
						}
					});
				}, 300);
			});
		}
	}
});
