import { TestBed } from '@angular/core/testing';

import { TradeServiceService } from './trade-service.service';

describe('TradeServiceService', () => {
  let service: TradeServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradeServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
