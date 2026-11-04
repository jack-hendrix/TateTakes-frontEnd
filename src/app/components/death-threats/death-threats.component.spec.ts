import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DeathThreatsComponent } from './death-threats.component';
import { DeathThreatService } from '../../services/death-threat.service';
import {
  createAuthServiceStub,
  createUiSpies,
  provideActivatedRoute,
  UiSpies,
} from '../../../testing/component-testing';

describe('DeathThreatsComponent', () => {
  let fixture: ComponentFixture<DeathThreatsComponent>;
  let component: DeathThreatsComponent;
  let threats: jasmine.SpyObj<DeathThreatService>;
  let ui: UiSpies;

  beforeEach(() => {
    threats = jasmine.createSpyObj<DeathThreatService>('DeathThreatService', [
      'newThreat',
    ]);
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [DeathThreatsComponent],
      providers: [
        provideRouter([]),
        provideActivatedRoute('deathThreats'),
        createAuthServiceStub().provider,
        { provide: DeathThreatService, useValue: threats },
        ...ui.providers,
      ],
    });
    fixture = TestBed.createComponent(DeathThreatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('does not submit an empty threat', () => {
    component.submitNewThreat();
    expect(threats.newThreat).not.toHaveBeenCalled();
  });

  it('sends the threat with newlines converted to <br>', fakeAsync(() => {
    threats.newThreat.and.resolveTo({} as never);
    component.threatForm.setValue({ message: 'line 1\nline 2' });

    component.submitNewThreat();
    tick();

    expect(threats.newThreat).toHaveBeenCalledWith('line 1<br>line 2');
    expect(ui.toastr.success).toHaveBeenCalled();
    expect(component.threatForm.value.message).toBeNull();
  }));

  it('shows an error when sending fails', fakeAsync(() => {
    spyOn(console, 'error');
    threats.newThreat.and.rejectWith(new Error('nope'));
    component.threatForm.setValue({ message: 'hi' });

    component.submitNewThreat();
    tick();

    expect(ui.toastr.error).toHaveBeenCalled();
    expect(component.threatForm.value.message).toBe('hi');
  }));

  it('caps the message at 1000 characters', () => {
    component.threatForm.setValue({ message: 'x'.repeat(1200) });
    component.checkCharLimit();
    expect(component.getMessageLength()).toBe(1000);
  });

  it('shows the character count', () => {
    component.threatForm.setValue({ message: 'hello' });
    fixture.detectChanges();
    expect(el().querySelector('.charCount')?.textContent?.trim()).toBe(
      '5/1000',
    );
  });
});
