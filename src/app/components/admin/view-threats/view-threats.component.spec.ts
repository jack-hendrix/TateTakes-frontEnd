import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ViewThreatsComponent } from './view-threats.component';
import { DeathThreatService } from '../../../services/death-threat.service';
import { Threat } from '../../../models/threat.model';
import { createUiSpies, UiSpies } from '../../../../testing/component-testing';

describe('ViewThreatsComponent', () => {
  let ui: UiSpies;

  function setup(threats$ = of<Threat[]>([])) {
    const service = jasmine.createSpyObj<DeathThreatService>(
      'DeathThreatService',
      ['getThreats'],
    );
    service.getThreats.and.returnValue(threats$);
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [ViewThreatsComponent],
      providers: [
        { provide: DeathThreatService, useValue: service },
        ...ui.providers,
      ],
    });
    const fixture = TestBed.createComponent(ViewThreatsComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('lists threats with their formatting', () => {
    const el = setup(
      of([
        { id: '1', message: 'first<br>line', date: new Date() },
        { id: '2', message: 'second', date: new Date() },
      ]),
    );
    const messages = el.querySelectorAll('.message');
    expect(messages.length).toBe(2);
    expect(messages[0].innerHTML).toBe('first<br>line');
    expect(ui.spinner.hide).toHaveBeenCalled();
  });

  it('strips scripts from threat messages', () => {
    spyOn(console, 'warn');
    const el = setup(
      of([
        {
          id: '1',
          message: '<img src=x onerror="alert(1)">hi',
          date: new Date(),
        },
      ]),
    );
    expect(el.querySelector('.message')?.innerHTML).not.toContain('onerror');
  });

  it('shows an error when threats fail to load', () => {
    spyOn(console, 'error');
    setup(throwError(() => new Error('offline')));
    expect(ui.toastr.error).toHaveBeenCalled();
    expect(ui.spinner.hide).toHaveBeenCalled();
  });
});
