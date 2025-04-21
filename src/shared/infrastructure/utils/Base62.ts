class Base62 {
	private static chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

	static encode(input: string | number): string {
		let num: bigint;

		if (typeof input === 'string') {
			// Convertimos la cadena a un número (BigInt) usando su representación en base 256 (ASCII).
			num = BigInt('0x' + [...input].map((c) => c.charCodeAt(0).toString(16)).join(''));
		} else {
			// Si el input es un número, lo convertimos a BigInt
			num = BigInt(input);
		}

		let result = '';
		while (num > 0n) {
			result = this.chars[Number(num % 62n)] + result;
			num = num / 62n;
		}
		return result || '0';
	}

	static decode(str: string): number {
		let num = 0;
		for (const char of str) {
			num = num * 62 + this.chars.indexOf(char);
		}
		return num;
	}
}

export default Base62;
