import { reducer, initialState } from './rfp-ui-edit-wrap.reducer';

describe('RfpUiEditWrap Reducer', () => {
  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as any;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });
});
