import { reducer, initialState } from './rfp-ui-edit-detail.reducer';

describe('RfpUiEditDetail Reducer', () => {
  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as any;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });
});
