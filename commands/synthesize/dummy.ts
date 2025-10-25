import { DiffTracker } from '../../diff.ts';
import { DEFAULT_CONTENT, parseDocument } from '../../markdown.ts';
import type { cy } from '../../mod.ts';
import AbstractSynthesizeCallHandler, { type SynthesizeRequest } from './mod.ts';

const BODY_TOKENS = [
	'Suspendisse placerat velit eu tortor vestibulum, non faucibus libero dignissim. Nullam vulputate ante odio, sed venenatis erat tincidunt vitae. Vivamus nulla eros, posuere at augue vel, dignissim ornare tortor. Pellentesque luctus sed ante a euismod. Quisque ut finibus ante, quis mollis eros. In hac habitasse platea dictumst. Vestibulum elit lectus, posuere in lectus finibus, imperdiet volutpat ipsum. Proin scelerisque imperdiet massa, in commodo nulla mattis vehicula. Praesent molestie lobortis mi, non suscipit diam fermentum at. Nullam ultrices turpis at mi maximus auctor. Nulla facilisi.',
	'Nulla aliquam dictum magna, ut pretium tellus sodales vitae. Pellentesque eget ornare nisi. Fusce faucibus porttitor ante, elementum suscipit neque sagittis ac. Proin maximus sagittis massa a pulvinar. Suspendisse efficitur, velit et vehicula pharetra, mauris libero tempus nisl, vel varius arcu mi eu mauris. Nam sit amet velit vel neque tincidunt malesuada. Nullam eleifend mi a tortor feugiat facilisis id tristique ante. Donec a augue lobortis, feugiat ipsum ut, suscipit arcu. Suspendisse potenti. Aenean eget sapien mattis, tincidunt odio eu, tincidunt ante. Etiam placerat pulvinar metus, vel sagittis ex vehicula sit amet. Quisque fringilla sed nisi id gravida. Aliquam pretium, ligula eget dignissim egestas, arcu justo elementum purus, ac efficitur ex erat luctus nunc. Aliquam egestas metus nec pretium condimentum.',
	'Curabitur semper et enim et ullamcorper. Pellentesque venenatis arcu vel turpis hendrerit accumsan. Quisque finibus, augue a bibendum egestas, elit est pulvinar dolor, a posuere risus lectus et ligula. Curabitur vitae enim in felis lacinia posuere. Donec ligula mi, consequat in gravida in, commodo eu magna. In dignissim nec libero non tincidunt. Morbi dictum non diam eu blandit. Donec at porta eros. Donec scelerisque libero purus, vulputate euismod massa molestie a. Proin dapibus fringilla nisi. Nullam porta lorem eget ultricies vehicula. Donec efficitur tempus tortor vel aliquet. Morbi sit amet leo ligula. Nam efficitur dignissim leo et congue. Donec urna nisl, pharetra id volutpat a, hendrerit nec enim.'
].map(x => x.split(' '));

export default class DummySynthesizer extends AbstractSynthesizeCallHandler {
	public override async *synthesize(req: SynthesizeRequest): AsyncGenerator<cy.RemoteSynthesisEvent, void> {
		const N_CHOICES = BODY_TOKENS.length;
		yield { ev: 'start', candidates: Array(N_CHOICES).fill({ role: req.role ?? { name: 'Agent', group: 'cy:agent' } }) };

		const maxTokens = Math.max(...BODY_TOKENS.map(x => x.length));
		const trackers = Array(N_CHOICES).fill(null).map(_ => new DiffTracker(DEFAULT_CONTENT));
		for (let i = 0; i <= maxTokens; i++) {
			for (let j = 0; j < N_CHOICES; j++) {
				const body = BODY_TOKENS[j];
				if (i <= body.length) {
					yield {
						ev: 'content',
						idx: j,
						patch: trackers[j].update(parseDocument(body.slice(0, i).join(' ')))
					};
				}
			}
			await new Promise(resolve => setTimeout(resolve, 89));
		}

		yield { ev: 'finish', tokensUsed: BODY_TOKENS.reduce((a, b) => a + b.length, 0) };
	}
}