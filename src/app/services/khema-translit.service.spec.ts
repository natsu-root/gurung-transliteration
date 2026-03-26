import { TestBed } from '@angular/core/testing';

import { KhemaTranslitService } from './khema-translit.service';

describe('KhemaTranslitService', () => {
  let service: KhemaTranslitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KhemaTranslitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
