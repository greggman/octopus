/*
 * Copyright 2012, Co-Octopi.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Co-Octopi. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
OctoRender = (function()
{

	function getOptions()
	{
		return{
			legWaveAmount: 0.1,
			legWaveSpeed: 2,
			legWaveOffset: 0.5,
			legCombineJoint1: 6,
			legCombineJoint2: 6,
			legCombineJoint3: 15,
			legCombineJoint4: 2
		};
	}

	function drawOctopus(ctx, info)
	{
		drawLegs(ctx, info);
		drawOctopusBody(info.expression.img, info.x, info.y, info.rotation, ctx);
	}

	function drawLegs(ctx, info)
	{
		var legsInfo = info.legsInfo;
		var scrunches = info.legMovement;
		var images = info.images;
		for (var i = 0; i < 8; i++){
			var legInfo = legsInfo[i];
			ctx.save();
			ctx.rotate(legInfo.rotation);
			ctx.translate(legInfo.xOff, legInfo.yOff);
			//make legs drift after death
			if(info.hasLost){
				ctx.translate(info.legDrift, info.legDrift);
			}
			drawLeg(ctx, info, 0, 0, scrunches[i] * legInfo.scrunchDir + legInfo.scrunchDir, i);
			ctx.restore();
		}
		if(info.hasLost){
			info.legDrift = info.legDrift + 1;
		}
	}

	function drawLeg(ctx, info, baseX, baseY, scrunch, legNdx)
	{
		var images = info.images;
		ctx.save();
		ctx.rotate((scrunch * 5) * Math.PI / 180);
		ctx.translate(baseX, baseY);
		var wave = Math.sin((info.clock + legNdx) * OPTIONS.legWaveSpeed) * OPTIONS.legWaveAmount;
		ctx.rotate(wave + (scrunch * 10) * Math.PI / 180);

		var img = images.legSegment1.img;
		ctx.save();
		ctx.translate(-img.width / 2, 0);
		ctx.drawImage(img, 0, 0);
		ctx.restore();

		ctx.translate(0, img.height - OPTIONS.legCombineJoint1);
		var wave = Math.sin((info.clock + legNdx + OPTIONS.legWaveOffset) * OPTIONS.legWaveSpeed) * OPTIONS.legWaveAmount;
		ctx.rotate(wave + (scrunch * 10) * Math.PI / 180);

		var img = images.legSegment2.img;
		ctx.save();
		ctx.translate(-img.width / 2, -OPTIONS.legCombineJoint2);
		ctx.drawImage(img, 0, 0);
		ctx.restore();

		ctx.translate(0, img.height - OPTIONS.legCombineJoint3);
		var wave = Math.sin((info.clock + legNdx + OPTIONS.legWaveOffset * 2) * OPTIONS.legWaveSpeed) * OPTIONS.legWaveAmount;
		ctx.rotate(wave + (scrunch * -10) * Math.PI / 180);

		var img = images.legTip.img;
		ctx.translate(-img.width / 2, -OPTIONS.legCombineJoint4);
		ctx.drawImage(img, 0, 0);
		ctx.restore();
		return;
	}

	function drawOctopusBody(image, x, y, rotation, ctx)
	{
		x = x - (image.img.width * .5);
		y = y - (image.img.height * .5);
		drawItem(image, x, y, rotation, ctx);
	}

	function drawItem(image, x, y, rotation, ctx)
	{
		ctx.save();
		ctx.rotate(rotation);
		ctx.drawImage(image.img, x, y);
		ctx.restore();
	}

	function getImages()
	{
		return{
			bodyHappy:{
				url: "images/octopus_body_yay.png"
			},
			bodyNormal:{
				url: "images/octopus_body.png"
			},
			bodyOw:{
				url: "images/octopus_body_ow.png"
			},
			legTip:{
				url: "images/octopus_leg3.png"
			},
			legSegment1:{
				url: "images/octopus_leg1.png"
			},
			legSegment2:{
				url: "images/octopus_leg2.png"
			}
		};
	}

	function getLegsInfo()
	{
		return [
			{ scrunchDir: -1, xOff:  0, yOff:  80, radius: 90, rotAccel: degToRad(-20), rotation: degToRad(270 - 15)},
			{ scrunchDir: -1, xOff:  0, yOff:  80, radius: 90, rotAccel: degToRad(-10), rotation: degToRad(270 + 15)},
			{ scrunchDir: -1, xOff:  0, yOff:  55, radius: 90, rotAccel: degToRad( -5), rotation: degToRad(0 - 30 - 15)},
			{ scrunchDir: -1, xOff:  0, yOff:  40, radius: 90, rotAccel: degToRad( -5), rotation: degToRad(0 - 30 + 15)},
			{ scrunchDir:  1, xOff:  0, yOff:  40, radius: 90, rotAccel: degToRad(  5), rotation: degToRad(0 + 30 - 15)},
			{ scrunchDir:  1, xOff:  0, yOff:  55, radius: 90, rotAccel: degToRad(  5), rotation: degToRad(0 + 30 + 15)},
			{ scrunchDir:  1, xOff:  0, yOff:  80, radius: 90, rotAccel: degToRad( 10), rotation: degToRad(90 - 15)},
			{ scrunchDir:  1, xOff:  0, yOff:  80, radius: 90, rotAccel: degToRad( 20), rotation: degToRad(90 + 15)},
		];
	}

	function markLeg(ctx, info, legNdx)
	{
		var legsInfo = info.legsInfo;
		var legInfo = legsInfo[legNdx];
		var scrunches = info.legMovement;
		ctx.save();
		ctx.rotate(legInfo.rotation);
		ctx.translate(legInfo.xOff, legInfo.yOff);
		var scrunch = scrunches[legNdx] * legInfo.scrunchDir + legInfo.scrunchDir;
		ctx.rotate((scrunch * 5) * Math.PI / 180);
		var wave = Math.sin((info.clock + legNdx) * OPTIONS.legWaveSpeed) * OPTIONS.legWaveAmount;
		ctx.rotate(wave + (scrunch * 10) * Math.PI / 180);
		ctx.translate(0, 40);
		ctx.scale(1, 4);
		ctx.strokeStyle = "yellow";
		var oldLineWidth = ctx.lineWidth;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(0, 0, 15, 0, Math.PI * 2, false);
		ctx.stroke();
		ctx.lineWidth = oldLineWidth;
		ctx.restore();
	}

	return {
		drawOctopus: drawOctopus,
		getImages: getImages,
		getLegsInfo: getLegsInfo,
		getOptions: getOptions,
		markLeg: markLeg,

		dummy: null  // marks end.
	};


}());

