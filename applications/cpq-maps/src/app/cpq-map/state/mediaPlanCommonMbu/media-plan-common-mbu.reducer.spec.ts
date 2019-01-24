import { reducer, initialState } from './media-plan-common-mbu.reducer';

describe('MediaPlanCommonMbu Reducer', () => {
  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as any;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });
});
